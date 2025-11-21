# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**奶茶大作战 (Milk Tea Battle)** is a web-based multiplayer business simulation game where 2-4 players compete as milk tea shop owners over 10 rounds. Players make strategic decisions about product research, pricing, marketing, and resource management to maximize cumulative profit.

- **Tech Stack**: React + TypeScript + Vite (frontend), Flask + SQLAlchemy + MySQL (backend)
- **Language**: Chinese (UI, comments, documentation)
- **Game Structure**: 10 rounds, 2-4 players, turn-based strategy

## Common Commands

### Backend Development

```bash
# From backend/ directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Initialize database (first time only)
python scripts/setup_database.py

# Run development server (port 8000)
python run.py

# The server runs at http://localhost:8000
# API documentation available at /docs endpoint
```

### Frontend Development

```bash
# From frontend/ directory
cd frontend

# Install dependencies
npm install

# Run development server (port 5173)
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

### Database Management

The database is hosted on Zeabur cloud. Connection details are in [backend/app/core/config.py](backend/app/core/config.py).

**Important Database Scripts:**
- `python scripts/setup_database.py` - Initialize all 12 tables and seed product recipes
- `python scripts/add_turn_order.py` - Add turn order field to players table
- `python scripts/add_game_name.py` - Add game name field to games table
- `python scripts/clear_all_games.py` - Clear all game data (testing utility)

## Architecture Overview

### Three-Layer Backend Architecture

The backend implements a three-module system mirroring the game design:

1. **Production Module (生产端)** - Player-facing decision interfaces
   - Shop management: Opening shops, decoration upgrades
   - Employee management: Hiring, firing, salary adjustments
   - Market actions: Advertising (800元), research (500元)
   - Product R&D: Research new products (600元, dice roll validation)
   - Production planning: Productivity allocation, pricing, material calculation

2. **Calculation Module (计算端)** - Backend game engine
   - Reputation score calculator: `广告分 + (圈粉率 × 累计销售数)`
   - Customer flow allocator: Core algorithm distributing customers to products
   - Bulk discount calculator: Material pricing with tiered discounts
   - Customer flow generator: Uses fixed 10-round script (not random)

3. **Finance Module (财务端)** - Automated reporting
   - Revenue/expense tracking
   - Profit calculation and rankings
   - Round-by-round financial reports

### Backend Code Organization

```
backend/app/
├── models/          # SQLAlchemy ORM models (12 database tables)
│   ├── game.py      # Games, CustomerFlow
│   ├── player.py    # Players, Shops, Employees
│   ├── product.py   # ProductRecipes, PlayerProducts, RoundProductions, MaterialInventories
│   └── finance.py   # FinanceRecords, ResearchLogs, MarketActions
│
├── services/        # Business logic layer (no direct DB in API routes)
│   ├── calculation_engine.py  # ReputationCalculator, CustomerFlowAllocator, DiscountCalculator
│   ├── production_service.py  # Production planning, pricing lock validation
│   ├── round_service.py       # Round advancement, customer flow generation
│   ├── finance_service.py     # Financial records, profit summaries
│   ├── shop_service.py        # Shop opening, decoration upgrades
│   ├── employee_service.py    # Hiring, firing, productivity tracking
│   ├── product_service.py     # Product research, unlocking, R&D difficulty
│   └── market_service.py      # Advertising, market research
│
├── api/v1/          # Flask blueprints (thin controllers calling services)
│   ├── game.py      # /api/v1/games
│   ├── player.py    # /api/v1/players
│   ├── production.py # /api/v1/production
│   ├── round.py     # /api/v1/rounds
│   ├── finance.py   # /api/v1/finance
│   ├── shop.py      # /api/v1/shops
│   ├── employee.py  # /api/v1/employees
│   ├── product.py   # /api/v1/products
│   └── market.py    # /api/v1/market
│
├── core/
│   ├── config.py    # Environment config, game constants (MAX_ROUNDS=10, etc.)
│   └── database.py  # SQLAlchemy setup
│
└── utils/
    └── game_constants.py  # GameConstants class with all game rules
```

### Frontend Code Organization

```
frontend/src/
├── pages/           # Main page components
│   ├── Lobby.tsx    # Game lobby (create/join room)
│   ├── Room.tsx     # Waiting room before game starts
│   └── Game.tsx     # Main game interface
│
├── components/game/ # Game-specific components
│   ├── GameHeader.tsx         # Round info, player stats
│   ├── PlayerList.tsx         # Player list display
│   ├── DecisionPanel.tsx      # Main decision interface container
│   ├── ShopDecision.tsx       # Shop opening/upgrade decisions
│   ├── EmployeeManagement.tsx # Employee hiring/firing
│   ├── MarketAction.tsx       # Advertising/research actions
│   ├── ProductResearch.tsx    # Product R&D interface
│   ├── ProductionPlan.tsx     # Production planning & pricing
│   ├── RoundSummary.tsx       # Round results display
│   ├── DiceRoller.tsx         # Dice rolling UI component
│   └── GameEnd.tsx            # Game over screen with rankings
│
├── stores/          # Zustand state management
│   ├── gameStore.ts       # Current game, player, players list
│   ├── gameRoundStore.ts  # Round-specific data
│   └── decisionStore.ts   # Decision submission state
│
├── api/             # Backend API clients (axios)
│   ├── client.ts    # Base axios configuration
│   ├── game.ts      # Game management APIs
│   ├── player.ts    # Player APIs
│   ├── production.ts # Production APIs
│   ├── round.ts     # Round APIs
│   ├── finance.ts   # Finance APIs
│   ├── shop.ts      # Shop APIs
│   ├── employee.ts  # Employee APIs
│   ├── product.ts   # Product APIs
│   └── market.ts    # Market APIs
│
└── types/
    └── index.ts     # TypeScript type definitions
```

## Critical Game Rules (in GameConstants)

These constants in [backend/app/utils/game_constants.py](backend/app/utils/game_constants.py) define the entire game economy:

### Core Game Parameters
- 10 rounds total (`TOTAL_ROUNDS = 10`)
- 2-4 players (`MIN_PLAYERS = 2`, `MAX_PLAYERS = 4`)
- Starting capital: 10,000元 (`INITIAL_CASH = 10000.0`)

### Shop Decoration System
```python
DECORATION_COSTS = {1: 400, 2: 800, 3: 1600}  # 简装/精装/豪华装
MAX_EMPLOYEES = {1: 2, 2: 3, 3: 4}  # Employee capacity per decoration level
```

### Material Pricing (per unit)
```python
MATERIAL_BASE_PRICES = {
    "tea": 6.0,        # 茶叶
    "milk": 4.0,       # 牛奶
    "fruit": 5.0,      # 水果
    "ingredient": 2.0  # 配料
}
```

### Bulk Discount System
- Every 50 units purchased: -10% price (up to 5 tiers = -50% max)
- Implemented in `DiscountCalculator.calculate_discount_price()`
- Example: 250+ units = 50% off base price

### Product R&D Difficulty
Three difficulty tiers with dice roll thresholds:
- Difficulty 1 (products 1-4): ≥2 to succeed (奶茶, 椰奶, 柠檬茶, 果汁)
- Difficulty 2 (products 5-6): ≥3 to succeed (珍珠奶茶, 水果奶昔)
- Difficulty 3 (product 7): ≥4 to succeed (水果茶)
- Cost: 600元 per attempt

### 7 Product Recipes
All products defined in `PRODUCT_RECIPES` constant with:
- Recipe ingredients (tea/milk/fruit/ingredient)
- Base fan rate (5%, 20%, or 30%)
- Production cost per unit
- R&D difficulty level

### Pricing Rules
- Valid range: 10-40元 (`MIN_PRICE`, `MAX_PRICE`)
- Must be multiples of 5 (`PRICE_STEP`)
- **Price lock**: Can only change every 3 rounds (validated in `production_service.py`)

### Market Action Costs
```python
MARKET_RESEARCH_COST = 500   # View next round's customer flow
ADVERTISEMENT_COST = 800     # Roll dice for 1-6 ad points
PRODUCT_RESEARCH_COST = 600  # Product R&D attempt
```

### Fixed Customer Flow Script
Customer flow is **NOT random** - uses predefined 10-round script in `CUSTOMER_FLOW_SCRIPT`:
```python
{
    1:  {"high": 40,  "low": 300},
    2:  {"high": 90,  "low": 280},
    # ... (10 rounds total)
    10: {"high": 190, "low": 610}
}
```

## Core Algorithms

### 1. Reputation Score Calculation
```python
口碑分 = 广告分 + (圈粉率 × 累计销售杯数)
```
Implemented in `ReputationCalculator.calculate()` - note that 圈粉率 is FIXED per product (no dynamic adjustment).

### 2. Customer Flow Allocation (Core Algorithm)

The most important algorithm in the game, implemented in `CustomerFlowAllocator.allocate()`:

**High-tier customers** (优先口碑):
1. Sort by reputation DESC
2. If tied, sort by price ASC
3. Allocate available production capacity sequentially

**Low-tier customers** (优先价格, but ONLY if reputation > 0):
1. Filter products with reputation > 0
2. Sort by price ASC
3. If tied, sort by reputation DESC
4. Allocate remaining production capacity

**Key principle**: High-tier customers get served FIRST from production capacity, then low-tier customers get the remainder.

### 3. Price Lock Validation

In `production_service.py`, pricing changes are validated:
- Track `last_price_change_round` per product
- If changed in round X, cannot change again until round X+3
- This prevents frequent price manipulation

## Database Schema

12 tables total - see [backend/scripts/setup_database.py](backend/scripts/setup_database.py) for full schema:

**Core tables:**
- `games` - Game rooms (room_code, status, current_round)
- `players` - Player data (nickname, cash, game_id, turn_order)
- `shops` - Shop info (player_id, rent, decoration_level)
- `employees` - Employee records (name, salary, productivity)

**Product tables:**
- `product_recipes` - 7 fixed product definitions (seeded on init)
- `player_products` - Products unlocked by each player (total_sold, current_ad_score, last_price_change_round)
- `round_productions` - Production plans per round (produced_quantity, price, sold_quantity)
- `material_inventories` - Material stock (expires after 1 round)

**Finance & Analytics:**
- `finance_records` - Detailed income/expense records per round
- `customer_flows` - Customer counts per round (from fixed script)
- `research_logs` - R&D attempt history
- `market_actions` - Advertising/research action logs

## Key API Patterns

All API responses follow this format:
```python
{
    "success": true,
    "data": {...},
    "message": "操作成功"
}
```

Error responses:
```python
{
    "success": false,
    "error": "错误信息",
    "code": "ERROR_CODE"
}
```

**Common validation patterns in services:**
- Cash balance checks before purchases
- Player ownership verification
- Round number validation
- Game status checks (must be 'in_progress' for most actions)

## Important Implementation Notes

### Backend Service Layer Pattern
- **ALWAYS** put business logic in `services/` layer, NOT in API routes
- API routes should be thin controllers: validate input → call service → return response
- Services handle all DB transactions, validations, and calculations
- Example: [production.py](backend/app/api/v1/production.py) calls `production_service.submit_production_plan()`

### Fixed Customer Flow (Not Random!)
When working on round progression or customer flow:
- DO NOT generate random customer counts
- ALWAYS use `GameConstants.CUSTOMER_FLOW_SCRIPT`
- The 10-round script is a core game balance feature

### Price Change Validation
When modifying pricing logic:
- MUST validate against `last_price_change_round` field
- 3-round lock is a critical game rule
- See [production_service.py:275-311](backend/app/services/production_service.py#L275-L311)

### Frontend State Management
- Use Zustand stores for global state (game, player, round data)
- API calls are centralized in `src/api/` directory
- All components use TypeScript with proper type definitions from `src/types/`

## Testing & Development Workflow

### Backend Testing
1. Ensure database is initialized: `python scripts/setup_database.py`
2. Start server: `python run.py`
3. Test API endpoints at `http://localhost:8000/api/v1/`
4. Use `/health` endpoint to verify server status

### Frontend Testing
1. Ensure backend is running on port 8000
2. Start frontend: `npm run dev`
3. Access at `http://localhost:5173`
4. Check CORS configuration in [backend/app/core/config.py](backend/app/core/config.py) if API calls fail

### Full Game Flow Testing
1. Create game (POST `/api/v1/games/create`)
2. Join players (POST `/api/v1/players/join/{room_code}`)
3. Start game (POST `/api/v1/games/{room_code}/start`)
4. For each round:
   - Submit decisions (shop, employee, market, product, production)
   - Advance round (POST `/api/v1/rounds/{game_id}/advance`)
   - View round summary (GET `/api/v1/rounds/{game_id}/{round}/summary`)
5. After 10 rounds, view final rankings (GET `/api/v1/finance/game/{game_id}/profit-summary`)

## Environment Configuration

Backend uses environment variables (`.env` file in `backend/`):
- `DATABASE_URL` - MySQL connection string (defaults to Zeabur cloud DB)
- `SECRET_KEY` - Flask secret key
- `DEBUG` - Enable debug mode (default: True)
- `CORS_ORIGINS` - Allowed frontend origins (default: localhost:3000,5173)

Frontend API base URL configured in [frontend/src/api/client.ts](frontend/src/api/client.ts):
- Default: `http://localhost:8000/api/v1`

## Deployment Notes

**Backend:**
- Production server: Use `ProductionConfig` in config.py
- Disable debug mode in production
- Ensure proper CORS_ORIGINS configuration
- Database credentials should be in environment variables, not hardcoded

**Frontend:**
- Build: `npm run build`
- Output in `frontend/dist/`
- Update API base URL for production deployment

## Reference Documentation

- [technical_design_document.md](technical_design_document.md) - Detailed technical specifications (800+ lines)
- [game_rules.md](game_rules.md) - Complete game rules and mechanics
- [codex/backend_implementation_summary.md](codex/backend_implementation_summary.md) - Backend implementation status
- [codex/frontend_design.md](codex/frontend_design.md) - Frontend design specifications
- [user_jiagou.md](user_jiagou.md) - System architecture documentation (Chinese)
