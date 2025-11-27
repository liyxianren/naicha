# 财务报表页面改造计划

## 项目目标

将现有的简单抽屉式财务报表改造为独立全屏页面，提供详细的财务分析，包括：
- 产品级别的成本、利润、客户类型分布
- 详细的原料采购和消耗记录
- 完整的收支明细

## 核心问题分析

### 关键Bug：原料成本未追踪

**位置**: `backend/app/services/round_service.py:340`
**问题**: 财务记录中 `material_expense` 始终为 0.0
**原因**: 原料成本在生产时已扣款（production_service.py:93）但未记录到财务表
**影响**: 财务报表缺失重要成本数据，利润计算不准确

### 缺失功能

1. **产品级成本分析**: 无法查看每个产品的材料成本和利润率
2. **原料采购明细**: 无法追溯原料购买的数量、单价、折扣
3. **客户分布数据**: 后端已记录但未暴露给前端（RoundProduction.sold_to_high_tier/sold_to_low_tier）

## 实施方案

### 1. 数据库改造

#### 新增表：material_purchases

```sql
CREATE TABLE material_purchases (
    id INT PRIMARY KEY AUTO_INCREMENT,
    player_id INT NOT NULL,
    round_number INT NOT NULL,
    material_type VARCHAR(20) NOT NULL,  -- 'tea', 'milk', 'fruit', 'ingredient'
    quantity INT NOT NULL,
    unit_price DECIMAL(8,2) NOT NULL,    -- 折扣后单价
    discount_rate DECIMAL(3,2) NOT NULL, -- 折扣率 (0.9 = 10% off)
    total_cost DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    UNIQUE KEY uk_player_round_material (player_id, round_number, material_type),
    INDEX idx_purchase_player_round (player_id, round_number)
);
```

#### 扩展表：finance_records

```sql
ALTER TABLE finance_records
ADD COLUMN material_purchases_json JSON COMMENT '原料采购明细',
ADD COLUMN product_details_json JSON COMMENT '产品级成本利润分析';
```

**设计理念**: 在提交生产计划时记录原料采购明细，回合结算时从采购记录中提取成本数据。

### 2. 后端核心修改

#### 2.1 修复原料成本追踪 (最关键)

**文件**: `backend/app/services/production_service.py`
**位置**: 第93行之后
**操作**: 添加MaterialPurchase记录创建逻辑

```python
# 在 player.cash -= Decimal(str(purchase_cost)) 之后添加

from app.models.finance import MaterialPurchase

for material, quantity in material_needs.items():
    if quantity <= 0:
        continue

    cost_detail = material_costs.get(material)
    if not cost_detail:
        continue

    # 删除旧记录（允许重新提交）
    MaterialPurchase.query.filter_by(
        player_id=player_id,
        round_number=round_number,
        material_type=material
    ).delete()

    # 创建采购记录
    purchase = MaterialPurchase(
        player_id=player_id,
        round_number=round_number,
        material_type=material,
        quantity=cost_detail['quantity'],
        unit_price=cost_detail['unit_price'],
        discount_rate=cost_detail['discount_rate'],
        total_cost=cost_detail['total']
    )
    db.session.add(purchase)
```

#### 2.2 修复财务记录Bug

**文件**: `backend/app/services/round_service.py`
**位置**: 第340行
**操作**: 替换硬编码的0.0为实际采购成本

```python
# 替换: expenses["material"] = 0.0
# 改为:

from app.models.finance import MaterialPurchase
material_purchases = MaterialPurchase.query.filter_by(
    player_id=player_id,
    round_number=round_number
).all()
expenses["material"] = sum(float(mp.total_cost) for mp in material_purchases)
```

#### 2.3 新增产品详情计算

**文件**: `backend/app/services/finance_service.py`
**位置**: 在类中添加新方法

```python
@staticmethod
def _calculate_product_details(player_id: int, round_number: int) -> List[Dict]:
    """计算产品级别的成本、利润、客户分布"""
    from app.models.product import PlayerProduct, RoundProduction
    from app.models.finance import MaterialPurchase

    productions = RoundProduction.query.filter_by(
        player_id=player_id,
        round_number=round_number
    ).all()

    # 获取原料单价
    material_prices = {}
    purchases = MaterialPurchase.query.filter_by(
        player_id=player_id,
        round_number=round_number
    ).all()
    for purchase in purchases:
        material_prices[purchase.material_type] = float(purchase.unit_price)

    product_details = []
    for prod in productions:
        player_product = PlayerProduct.query.get(prod.product_id)
        if not player_product:
            continue

        recipe = player_product.recipe

        # 计算材料成本
        total_material_cost = 0.0
        materials_used = {}

        for material, amount_per_unit in recipe.recipe_json.items():
            total_units = amount_per_unit * prod.produced_quantity
            unit_price = material_prices.get(material, 0)
            material_total = total_units * unit_price

            materials_used[material] = {
                "quantity": total_units,
                "unit_cost": unit_price,
                "total": round(material_total, 2)
            }
            total_material_cost += material_total

        revenue = float(prod.revenue or 0)
        profit = revenue - total_material_cost

        product_details.append({
            "product_id": prod.product_id,
            "product_name": recipe.name,
            "price": float(prod.price),
            "produced_quantity": prod.produced_quantity,
            "sold_quantity": prod.sold_quantity,
            "sold_to_high_tier": prod.sold_to_high_tier,
            "sold_to_low_tier": prod.sold_to_low_tier,
            "revenue": revenue,
            "material_cost": round(total_material_cost, 2),
            "profit": round(profit, 2),
            "materials_used": materials_used
        })

    return product_details
```

#### 2.4 更新财务记录生成

**文件**: `backend/app/services/finance_service.py`
**位置**: `generate_finance_record()` 方法中

在创建FinanceRecord对象时添加JSON字段：

```python
# 计算产品详情
product_details = FinanceService._calculate_product_details(player_id, round_number)

# 获取原料采购明细
from app.models.finance import MaterialPurchase
purchases = MaterialPurchase.query.filter_by(
    player_id=player_id,
    round_number=round_number
).all()

material_purchases_json = {
    material.material_type: {
        "quantity": material.quantity,
        "unit_price": float(material.unit_price),
        "discount_rate": float(material.discount_rate),
        "total_cost": float(material.total_cost)
    }
    for material in purchases
}

# 在创建FinanceRecord时添加
record = FinanceRecord(
    # ... 现有字段 ...
    material_purchases_json=material_purchases_json,
    product_details_json={"products": product_details}
)
```

#### 2.5 新增API端点

**文件**: `backend/app/api/v1/finance.py`
**位置**: 添加新路由

```python
@finance_bp.route('/<int:player_id>/<int:round_number>/detailed', methods=['GET'])
def get_detailed_round_report(player_id: int, round_number: int):
    """获取详细财务报表（包含产品分析和原料明细）"""
    try:
        player = Player.query.get(player_id)
        if not player:
            return jsonify({"success": False, "error": f"玩家 {player_id} 不存在"}), 404

        record = FinanceRecord.query.filter_by(
            player_id=player_id,
            round_number=round_number
        ).first()

        if not record:
            return jsonify({"success": False, "error": f"第 {round_number} 回合无财务记录"}), 404

        result = {
            "player_id": player_id,
            "round_number": round_number,
            "revenue": {
                "total": float(record.total_revenue),
                "products": record.product_details_json.get("products", []) if record.product_details_json else []
            },
            "expenses": {
                "fixed": {
                    "rent": float(record.rent_expense),
                    "salary": float(record.salary_expense),
                    "total": float(record.rent_expense) + float(record.salary_expense)
                },
                "materials": {
                    "purchased": record.material_purchases_json or {},
                    "total": float(record.material_expense)
                },
                "temporary": {
                    "decoration": float(record.decoration_expense),
                    "market_research": float(record.research_expense),
                    "advertisement": float(record.ad_expense),
                    "product_research": float(record.research_cost),
                    "total": sum([
                        float(record.decoration_expense),
                        float(record.research_expense),
                        float(record.ad_expense),
                        float(record.research_cost)
                    ])
                },
                "total": float(record.total_expense)
            },
            "profit": {
                "round": float(record.round_profit),
                "cumulative": float(record.cumulative_profit)
            }
        }

        return jsonify({"success": True, "data": result}), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
```

#### 2.6 新增数据模型

**文件**: `backend/app/models/finance.py`
**位置**: 在文件中添加新模型

```python
class MaterialPurchase(db.Model):
    """原料采购记录模型"""
    __tablename__ = "material_purchases"

    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('players.id', ondelete='CASCADE'), nullable=False)
    round_number = db.Column(db.Integer, nullable=False)
    material_type = db.Column(db.String(20), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.DECIMAL(8, 2), nullable=False)
    discount_rate = db.Column(db.DECIMAL(3, 2), nullable=False)
    total_cost = db.Column(db.DECIMAL(10, 2), nullable=False)
    created_at = db.Column(db.TIMESTAMP, default=datetime.utcnow)

    player = db.relationship("Player", back_populates="material_purchases")

    __table_args__ = (
        db.UniqueConstraint('player_id', 'round_number', 'material_type',
                          name='uk_player_round_material'),
        db.Index('idx_purchase_player_round', 'player_id', 'round_number'),
    )
```

同时在FinanceRecord模型中添加：

```python
material_purchases_json = db.Column(db.JSON, nullable=True)
product_details_json = db.Column(db.JSON, nullable=True)
```

### 3. 前端实现

#### 3.1 创建独立页面

**新文件**: `frontend/src/pages/FinanceReport.tsx`

核心功能：
- 全屏展示，从Game页面导航进入
- 回合选择（Tab形式）
- 四大区块：
  1. 营收区块：产品销售表格（产品名、定价、销量、收入、成本、利润、客户类型分布）
  2. 固定成本区块：房租 + 人力成本总额
  3. 原料成本区块：采购明细表格（原料类型、单价、数量、总价）
  4. 临时成本区块：装修、调研、广告、研发
- 汇总卡片：总收入、总支出、本回合利润、累计利润

UI布局建议：
- 顶部：回合Tab + 返回按钮
- 中间：汇总卡片（4个指标）
- 下方：分区块展示（使用Card组件分隔）

#### 3.2 添加路由

**文件**: `frontend/src/App.tsx`

```typescript
import { FinanceReport } from './pages/FinanceReport';

// 在路由配置中添加
<Route
  path="/finance-report"
  element={<RequireSession><FinanceReport /></RequireSession>}
/>
```

#### 3.3 从Game页面导航

**文件**: `frontend/src/pages/Game.tsx`

添加导航按钮：

```typescript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

const handleOpenFinanceReport = () => {
  navigate('/finance-report', {
    state: {
      playerId: currentPlayer?.id,
      currentRound: game?.current_round
    }
  });
};

// 在界面中添加按钮
<Button icon={<FileTextOutlined />} onClick={handleOpenFinanceReport}>
  财务报表
</Button>
```

#### 3.4 更新TypeScript类型

**文件**: `frontend/src/types/index.ts`

```typescript
export interface DetailedFinanceReport {
  player_id: number;
  round_number: number;
  revenue: {
    total: number;
    products: Array<{
      product_id: number;
      product_name: string;
      price: number;
      produced_quantity: number;
      sold_quantity: number;
      sold_to_high_tier: number;
      sold_to_low_tier: number;
      revenue: number;
      material_cost: number;
      profit: number;
      materials_used: Record<string, {
        quantity: number;
        unit_cost: number;
        total: number;
      }>;
    }>;
  };
  expenses: {
    fixed: { rent: number; salary: number; total: number };
    materials: {
      purchased: Record<string, {
        quantity: number;
        unit_price: number;
        discount_rate: number;
        total_cost: number;
      }>;
      total: number
    };
    temporary: {
      decoration: number;
      market_research: number;
      advertisement: number;
      product_research: number;
      total: number
    };
    total: number;
  };
  profit: { round: number; cumulative: number };
}
```

#### 3.5 更新API客户端

**文件**: `frontend/src/api/finance.ts`

```typescript
getDetailedRoundReport: (playerId: number, roundNumber: number) => {
  return request.get<DetailedFinanceReport>(`/finance/${playerId}/${roundNumber}/detailed`);
}
```

### 4. 数据库迁移

**新文件**: `backend/scripts/add_finance_details.py`

```python
"""
添加财务详情功能的数据库迁移
- 创建 material_purchases 表
- 扩展 finance_records 表
"""
import os
import sys
from pathlib import Path

# 添加项目根目录到路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from dotenv import load_dotenv
load_dotenv()

from app.core.database import db, get_engine
from sqlalchemy import text

def run_migration():
    engine = get_engine()

    with engine.connect() as conn:
        print("开始数据库迁移...")

        # 1. 创建 material_purchases 表
        print("创建 material_purchases 表...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS material_purchases (
                id INT PRIMARY KEY AUTO_INCREMENT,
                player_id INT NOT NULL,
                round_number INT NOT NULL,
                material_type VARCHAR(20) NOT NULL,
                quantity INT NOT NULL,
                unit_price DECIMAL(8,2) NOT NULL,
                discount_rate DECIMAL(3,2) NOT NULL,
                total_cost DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
                UNIQUE KEY uk_player_round_material (player_id, round_number, material_type),
                INDEX idx_purchase_player_round (player_id, round_number)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """))
        conn.commit()

        # 2. 扩展 finance_records 表
        print("扩展 finance_records 表...")
        try:
            conn.execute(text("""
                ALTER TABLE finance_records
                ADD COLUMN material_purchases_json JSON COMMENT '原料采购明细',
                ADD COLUMN product_details_json JSON COMMENT '产品级成本利润分析';
            """))
            conn.commit()
        except Exception as e:
            if "Duplicate column name" in str(e):
                print("列已存在，跳过")
            else:
                raise

        print("迁移完成！")

if __name__ == "__main__":
    run_migration()
```

## 实施步骤

### 阶段1：后端数据层（第1-3天）

1. 运行数据库迁移脚本
2. 在 `backend/app/models/finance.py` 添加 MaterialPurchase 模型
3. 在 FinanceRecord 模型添加 JSON 字段
4. 在 `production_service.py` 添加采购记录创建逻辑
5. 修复 `round_service.py` 的材料成本bug
6. 测试：提交生产计划后验证 material_purchases 表有数据

### 阶段2：后端业务逻辑（第4-6天）

1. 在 `finance_service.py` 实现 `_calculate_product_details()` 方法
2. 更新 `generate_finance_record()` 方法填充 JSON 字段
3. 在 `finance.py` 添加 `/detailed` API 端点
4. 测试：验证API返回完整的详细财务数据

### 阶段3：前端界面（第7-10天）

1. 创建 `frontend/src/pages/FinanceReport.tsx`
2. 实现回合Tab选择和数据加载
3. 实现产品销售表格（含客户类型标签）
4. 实现固定成本、原料成本、临时成本区块
5. 实现汇总卡片
6. 添加路由和导航

### 阶段4：集成测试（第11-12天）

1. 完整游戏流程测试：创建游戏 → 多回合操作 → 查看财务报表
2. 边缘情况测试：无销售、无采购、价格变动
3. 多玩家测试：验证数据隔离
4. 性能测试：API响应时间、大数据量渲染

## 关键文件清单

### 必须修改的后端文件

1. `backend/app/services/production_service.py` - 添加采购记录（第93行后）
2. `backend/app/services/round_service.py` - 修复材料成本bug（第340行）
3. `backend/app/services/finance_service.py` - 新增产品详情计算
4. `backend/app/models/finance.py` - 新增模型和字段
5. `backend/app/api/v1/finance.py` - 新增API端点

### 必须创建的后端文件

6. `backend/scripts/add_finance_details.py` - 数据库迁移脚本

### 必须创建/修改的前端文件

7. `frontend/src/pages/FinanceReport.tsx` - 新页面（创建）
8. `frontend/src/types/index.ts` - 新增类型定义
9. `frontend/src/api/finance.ts` - 新增API方法
10. `frontend/src/App.tsx` - 添加路由
11. `frontend/src/pages/Game.tsx` - 添加导航按钮

## 预期成果

完成后，用户将获得：

1. **准确的财务数据**: 材料成本不再为0，所有成本正确记录
2. **产品级分析**: 每个产品的成本、利润、盈利能力一目了然
3. **客户洞察**: 了解高低购买力客户的购买偏好
4. **采购透明**: 清楚看到原料采购的数量、价格、折扣
5. **独立大屏**: 财务报表有专属页面，信息展示更丰富

## 风险与注意事项

1. **数据迁移**: 现有游戏的财务记录不会自动更新，只影响新回合
2. **性能考虑**: 产品详情计算涉及多表查询，需注意SQL优化
3. **兼容性**: 确保旧版财务记录（无JSON字段）不会导致前端报错
4. **i18n**: 需要为新增的文本添加中英文翻译
