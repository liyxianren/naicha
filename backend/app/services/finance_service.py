"""
Finance service
Handles finance record generation, profit calculation, and financial reports
"""
from typing import Dict, List
from app.core.database import db
from app.models.player import Player
from app.models.product import RoundProduction, PlayerProduct
from app.models.finance import FinanceRecord, MaterialPurchase
from app.services.round_service import RoundService


class FinanceService:
    """Finance management service"""

    @staticmethod
    def generate_finance_record(player_id: int, round_number: int) -> FinanceRecord:
        """
        Generate finance record for a player in a specific round

        Process:
        1. Calculate total revenue from sales
        2. Calculate all expenses
        3. Calculate round profit = revenue - expenses
        4. Calculate cumulative profit
        5. Save finance record
        6. Update player's total_profit

        Args:
            player_id: Player ID
            round_number: Round number

        Returns:
            FinanceRecord object

        Raises:
            ValueError: If player not found
        """
        player = Player.query.get(player_id)
        if not player:
            raise ValueError(f"Player {player_id} not found")

        # Check if record already exists
        existing = FinanceRecord.query.filter_by(
            player_id=player_id,
            round_number=round_number
        ).first()

        if existing:
            return existing

        # 1. Calculate revenue
        revenue_data = FinanceService._calculate_revenue(player_id, round_number)

        # 2. Calculate expenses
        expenses = RoundService.calculate_round_expenses(player_id, round_number)

        # 3. Calculate profit
        round_profit = revenue_data["total"] - expenses["total"]

        # 4. Get previous cumulative profit
        previous_record = FinanceRecord.query.filter_by(
            player_id=player_id,
            round_number=round_number - 1
        ).first()

        previous_cumulative = float(previous_record.cumulative_profit) if previous_record else 0.0
        cumulative_profit = previous_cumulative + round_profit

        # 5. Calculate product details for enhanced reporting
        product_details = FinanceService._calculate_product_details(player_id, round_number)

        # 6. Get material purchases for JSON storage
        purchases = MaterialPurchase.query.filter_by(
            player_id=player_id,
            round_number=round_number
        ).all()

        material_purchases_json = {
            purchase.material_type: {
                "quantity": purchase.quantity,
                "unit_price": float(purchase.unit_price),
                "discount_rate": float(purchase.discount_rate),
                "total_cost": float(purchase.total_cost)
            }
            for purchase in purchases
        }

        # 7. Create finance record with enhanced data
        finance_record = FinanceRecord(
            player_id=player_id,
            round_number=round_number,
            # Revenue
            total_revenue=revenue_data["total"],
            revenue_breakdown=revenue_data["breakdown"],
            # Expenses
            rent_expense=expenses["rent"],
            salary_expense=expenses["salary"],
            material_expense=expenses["material"],
            decoration_expense=expenses["decoration"],
            research_expense=expenses["market_research"],
            ad_expense=expenses["advertisement"],
            research_cost=expenses["product_research"],
            total_expense=expenses["total"],
            # Profit
            round_profit=round_profit,
            cumulative_profit=cumulative_profit,
            # Enhanced JSON data
            material_purchases_json=material_purchases_json,
            product_details_json={"products": product_details}
        )

        db.session.add(finance_record)

        # 6. Update player's total_profit
        player.total_profit = cumulative_profit

        db.session.commit()

        return finance_record

    @staticmethod
    def get_finance_record(player_id: int, round_number: int) -> Dict:
        """
        Get finance record for a player in a specific round

        Args:
            player_id: Player ID
            round_number: Round number

        Returns:
            Finance record dictionary

        Raises:
            ValueError: If record not found
        """
        record = FinanceRecord.query.filter_by(
            player_id=player_id,
            round_number=round_number
        ).first()

        if not record:
            raise ValueError(f"No finance record found for player {player_id}, round {round_number}")

        return record.to_dict()

    @staticmethod
    def get_all_finance_records(player_id: int) -> List[Dict]:
        """
        Get all finance records for a player

        Args:
            player_id: Player ID

        Returns:
            List of finance record dictionaries
        """
        records = FinanceRecord.query.filter_by(player_id=player_id).order_by(
            FinanceRecord.round_number.asc()
        ).all()

        return [record.to_dict() for record in records]

    @staticmethod
    def get_profit_summary(game_id: int) -> Dict:
        """
        Get profit summary for all players in a game

        Args:
            game_id: Game ID

        Returns:
            {
                "players": [
                    {
                        "player_id": 1,
                        "nickname": "Player 1",
                        "total_profit": 5000.0,
                        "cash": 12000.0,
                        "rank": 1
                    },
                    ...
                ]
            }
        """
        from app.models.game import Game

        game = Game.query.get(game_id)
        if not game:
            raise ValueError(f"Game {game_id} not found")

        players = Player.query.filter_by(game_id=game_id, is_active=True).all()

        player_data = []
        for player in players:
            player_data.append({
                "player_id": player.id,
                "nickname": player.nickname,
                "total_profit": float(player.total_profit),
                "cash": float(player.cash)
            })

        # Sort by total profit descending
        player_data.sort(key=lambda x: x["total_profit"], reverse=True)

        # Add rank
        for idx, data in enumerate(player_data):
            data["rank"] = idx + 1

        return {
            "game_id": game_id,
            "current_round": game.current_round,
            "players": player_data
        }

    @staticmethod
    def get_detailed_report(player_id: int) -> Dict:
        """
        Get detailed financial report for a player

        Args:
            player_id: Player ID

        Returns:
            {
                "player_id": 1,
                "nickname": "Player 1",
                "current_cash": 12000.0,
                "total_profit": 5000.0,
                "rounds": [
                    {
                        "round": 1,
                        "revenue": 450.0,
                        "expenses": 300.0,
                        "profit": 150.0,
                        "cumulative_profit": 150.0
                    },
                    ...
                ]
            }
        """
        player = Player.query.get(player_id)
        if not player:
            raise ValueError(f"Player {player_id} not found")

        # Get all finance records
        records = FinanceRecord.query.filter_by(player_id=player_id).order_by(
            FinanceRecord.round_number.asc()
        ).all()

        rounds_data = []
        for record in records:
            rounds_data.append({
                "round": record.round_number,
                "revenue": float(record.total_revenue),
                "expenses": float(record.total_expense),
                "profit": float(record.round_profit),
                "cumulative_profit": float(record.cumulative_profit)
            })

        return {
            "player_id": player.id,
            "nickname": player.nickname,
            "current_cash": float(player.cash),
            "total_profit": float(player.total_profit),
            "rounds": rounds_data
        }

    @staticmethod
    def _calculate_revenue(player_id: int, round_number: int) -> Dict:
        """
        Calculate total revenue and breakdown for a player in a round

        Args:
            player_id: Player ID
            round_number: Round number

        Returns:
            {
                "total": 450.0,
                "breakdown": [
                    {"product_name": "Milk Tea", "quantity": 5, "price": 15.0, "revenue": 75.0},
                    ...
                ]
            }
        """
        productions = RoundProduction.query.filter_by(
            player_id=player_id,
            round_number=round_number
        ).all()

        total_revenue = 0.0
        breakdown = []

        for prod in productions:
            revenue = float(prod.revenue)
            total_revenue += revenue

            # Get product name
            player_product = PlayerProduct.query.get(prod.product_id)
            product_name = player_product.recipe.name if player_product and player_product.recipe else "Unknown"

            breakdown.append({
                "product_name": product_name,
                "quantity": prod.sold_quantity,
                "price": float(prod.price),
                "revenue": revenue
            })

        return {
            "total": total_revenue,
            "breakdown": breakdown
        }

    @staticmethod
    def _calculate_product_details(player_id: int, round_number: int) -> List[Dict]:
        """
        Calculate product-level cost, profit, and customer distribution

        Args:
            player_id: Player ID
            round_number: Round number

        Returns:
            List of product detail dictionaries with:
            - product_id, product_name, price
            - produced_quantity, sold_quantity
            - sold_to_high_tier, sold_to_low_tier
            - revenue, material_cost, profit
            - materials_used breakdown
        """
        productions = RoundProduction.query.filter_by(
            player_id=player_id,
            round_number=round_number
        ).all()

        # Get material unit prices from purchases
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
            if not recipe:
                continue

            # Calculate material cost for this product
            total_material_cost = 0.0
            materials_used = {}

            recipe_json = recipe.recipe_json or {}
            for material, amount_per_unit in recipe_json.items():
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
                "sold_to_high_tier": prod.sold_to_high_tier or 0,
                "sold_to_low_tier": prod.sold_to_low_tier or 0,
                "revenue": revenue,
                "material_cost": round(total_material_cost, 2),
                "profit": round(profit, 2),
                "materials_used": materials_used
            })

        return product_details


# Export
__all__ = ['FinanceService']
