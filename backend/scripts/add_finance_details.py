"""
添加财务详情功能的数据库迁移
- 创建 material_purchases 表
- 扩展 finance_records 表
"""
import sys
import os
import re

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pymysql
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 从应用配置获取数据库连接信息（与 config.py 保持一致）
DATABASE_URL = os.getenv(
    'DATABASE_URL',
    'mysql+pymysql://root:I51dXb3JY6vgM87uf2SBsQ9W4yKRhOt0@sfo1.clusters.zeabur.com:32206/zeabur'
)

# 解析数据库连接URL
# 格式: mysql+pymysql://user:password@host:port/database
def parse_database_url(url):
    """解析数据库URL为连接参数"""
    # 移除协议前缀
    url = url.replace('mysql+pymysql://', '').replace('mysql://', '')
    
    # 分离用户信息和主机信息
    if '@' in url:
        auth, host_db = url.rsplit('@', 1)
        if ':' in auth:
            user, password = auth.split(':', 1)
        else:
            user, password = auth, ''
    else:
        user, password = 'root', ''
        host_db = url
    
    # 分离主机:端口和数据库
    if '/' in host_db:
        host_port, database = host_db.split('/', 1)
    else:
        host_port, database = host_db, 'naicha'
    
    # 分离主机和端口
    if ':' in host_port:
        host, port = host_port.split(':')
        port = int(port)
    else:
        host, port = host_port, 3306
    
    return {
        "host": host,
        "port": port,
        "user": user,
        "password": password,
        "database": database,
        "charset": "utf8mb4"
    }

DB_CONFIG = parse_database_url(DATABASE_URL)


def run_migration():
    """Execute database migration"""
    print(f"Connecting to database: {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}")
    
    # Connect to database
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()

    try:
        print("=" * 60)
        print("Starting database migration: Add finance details feature")
        print("=" * 60)

        # 1. 创建 material_purchases 表
        print("\n[1/2] Creating material_purchases table...")
        try:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS material_purchases (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    player_id INT NOT NULL,
                    round_number INT NOT NULL,
                    material_type VARCHAR(20) NOT NULL COMMENT 'Material type: tea/milk/fruit/ingredient',
                    quantity INT NOT NULL COMMENT 'Purchase quantity',
                    unit_price DECIMAL(8,2) NOT NULL COMMENT 'Discounted unit price',
                    discount_rate DECIMAL(3,2) NOT NULL COMMENT 'Discount rate (0.9 = 10% off)',
                    total_cost DECIMAL(10,2) NOT NULL COMMENT 'Total cost',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
                    UNIQUE KEY uk_player_round_material (player_id, round_number, material_type),
                    INDEX idx_purchase_player_round (player_id, round_number)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Material purchase records';
            """)
            conn.commit()
            print("[OK] material_purchases table created successfully")
        except Exception as e:
            if "already exists" in str(e).lower():
                print("[OK] material_purchases table already exists, skipped")
            else:
                print(f"[FAIL] Failed to create material_purchases table: {e}")
                raise

        # 2. 扩展 finance_records 表
        print("\n[2/2] Extending finance_records table...")
        try:
            # 检查列是否已存在
            cursor.execute("""
                SELECT COUNT(*) as cnt
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'finance_records'
                AND COLUMN_NAME IN ('material_purchases_json', 'product_details_json');
            """)
            existing_count = cursor.fetchone()[0]

            if existing_count == 0:
                cursor.execute("""
                    ALTER TABLE finance_records
                    ADD COLUMN material_purchases_json JSON COMMENT 'Material purchase details',
                    ADD COLUMN product_details_json JSON COMMENT 'Product-level cost/profit analysis';
                """)
                conn.commit()
                print("[OK] finance_records table extended successfully")
            elif existing_count == 2:
                print("[OK] finance_records table already has all columns, skipped")
            else:
                # 部分列存在，尝试单独添加
                cursor.execute("""
                    SELECT COLUMN_NAME
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE()
                    AND TABLE_NAME = 'finance_records'
                    AND COLUMN_NAME IN ('material_purchases_json', 'product_details_json');
                """)
                existing_cols = [row[0] for row in cursor.fetchall()]
                
                if 'material_purchases_json' not in existing_cols:
                    cursor.execute("""
                        ALTER TABLE finance_records
                        ADD COLUMN material_purchases_json JSON COMMENT 'Material purchase details';
                    """)
                    conn.commit()
                    print("[OK] Added material_purchases_json column")
                    
                if 'product_details_json' not in existing_cols:
                    cursor.execute("""
                        ALTER TABLE finance_records
                        ADD COLUMN product_details_json JSON COMMENT 'Product-level cost/profit analysis';
                    """)
                    conn.commit()
                    print("[OK] Added product_details_json column")
                    
        except Exception as e:
            if "duplicate column name" in str(e).lower():
                print("[OK] finance_records table columns already exist, skipped")
            else:
                print(f"[FAIL] Failed to extend finance_records table: {e}")
                raise

        print("\n" + "=" * 60)
        print("[SUCCESS] Database migration completed!")
        print("=" * 60)

    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    try:
        run_migration()
    except Exception as e:
        print(f"\n[FAIL] Migration failed: {e}")
        sys.exit(1)
