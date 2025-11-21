"""
Round service
Handles round progression, customer flow generation, and settlement
"""
import random
from typing import Dict
from app.core.database import db
from app.models.game import Game, CustomerFlow
from app.models.player import Player, Employee
from app.models.product import RoundProduction
from app.services.calculation_engine import CustomerFlowAllocator
from app.utils.game_constants import GameConstants


class RoundService:
    """Round management service"""

    @staticmethod
    def advance_round(game_id: int) -> Dict:
        """
        Advance to next round

        Process:
        1. Verify game is in progress
        2. Check all players submitted production plans
        3. Generate customer flow
        4. Allocate customers to products (call CustomerFlowAllocator)
        5. Calculate revenue for each player
        6. Advance to next round
        7. Check if game is finished

        Args:
            game_id: Game ID

        Returns:
            {
                "success": True,
                "previous_round": 1,
                "current_round": 2,
                "customer_flow": {...},
                "allocation_result": {...},
                "game_finished": False
            }

        Raises:
            ValueError: Various validation errors
        """
        game = Game.query.get(game_id)
        if not game:
            raise ValueError(f"Game {game_id} not found")

        if game.status != 'in_progress':
            raise ValueError(f"Game is not in progress (current status: {game.status})")

        current_round = game.current_round

        # 1. Check if all active players submitted production plans
        RoundService._verify_all_players_submitted(game_id, current_round)

        # 2. Generate customer flow for current round
        customer_flow = RoundService.generate_customer_flow(game_id, current_round)

        # 3. Allocate customers to products
        allocation_result = CustomerFlowAllocator.allocate(game_id, current_round)

        # 4. Update player revenue (already done in CustomerFlowAllocator._save_sales)
        RoundService._update_player_revenue(game_id, current_round)

        # 5. Advance to next round
        previous_round = current_round
        game.current_round += 1

        # 6. Check if game is finished
        game_finished = False
        if game.current_round > GameConstants.TOTAL_ROUNDS:
            game.status = 'finished'
            game_finished = True

        db.session.commit()

        return {
            "success": True,
            "previous_round": previous_round,
            "current_round": game.current_round,
            "customer_flow": customer_flow.to_dict(),
            "allocation_result": allocation_result,
            "game_finished": game_finished
        }

    @staticmethod
    def generate_customer_flow(game_id: int, round_number: int) -> CustomerFlow:
        """
        Generate customer flow for a round using fixed script

        Uses fixed script from GameConstants.CUSTOMER_FLOW_SCRIPT
        Rounds 1-10 have predefined customer numbers

        Args:
            game_id: Game ID
            round_number: Round number

        Returns:
            CustomerFlow object
        """
        # Check if already exists
        existing = CustomerFlow.query.filter_by(
            game_id=game_id,
            round_number=round_number
        ).first()

        if existing:
            return existing

        # Use fixed customer flow script
        if round_number in GameConstants.CUSTOMER_FLOW_SCRIPT:
            flow_data = GameConstants.CUSTOMER_FLOW_SCRIPT[round_number]
            high_tier = flow_data["high"]
            low_tier = flow_data["low"]
        else:
            # Fallback for invalid round numbers
            raise ValueError(f"Invalid round number: {round_number}. Must be 1-10.")

        customer_flow = CustomerFlow(
            game_id=game_id,
            round_number=round_number,
            high_tier_customers=high_tier,
            low_tier_customers=low_tier
        )

        db.session.add(customer_flow)
        db.session.commit()

        return customer_flow

    @staticmethod
    def get_round_summary(game_id: int, round_number: int) -> Dict:
        """
        Get summary of a specific round

        Args:
            game_id: Game ID
            round_number: Round number

        Returns:
            {
                "round_number": 1,
                "customer_flow": {...},
                "players": [
                    {
                        "player_id": 1,
                        "nickname": "Player 1",
                        "productions": [...],
                        "total_revenue": 450.0,
                        "total_sold": 15
                    },
                    ...
                ]
            }
        """
        # Get customer flow
        customer_flow = CustomerFlow.query.filter_by(
            game_id=game_id,
            round_number=round_number
        ).first()

        if not customer_flow:
            raise ValueError(f"No customer flow data for round {round_number}")

        # Get all active players
        players = Player.query.filter_by(game_id=game_id, is_active=True).all()

        player_summaries = []
        for player in players:
            # Get player's productions for this round
            productions = RoundProduction.query.filter_by(
                player_id=player.id,
                round_number=round_number
            ).all()

            total_revenue = sum(float(p.revenue) for p in productions)
            total_sold = sum(p.sold_quantity for p in productions)

            player_summaries.append({
                "player_id": player.id,
                "nickname": player.nickname,
                "productions": [
                    {
                        "product_name": p.product_id,  # TODO: Get actual product name
                        "produced": p.produced_quantity,
                        "sold": p.sold_quantity,
                        "sold_to_high": p.sold_to_high_tier,
                        "sold_to_low": p.sold_to_low_tier,
                        "price": float(p.price),
                        "revenue": float(p.revenue)
                    } for p in productions
                ],
                "total_revenue": total_revenue,
                "total_sold": total_sold
            })

        return {
            "round_number": round_number,
            "customer_flow": customer_flow.to_dict(),
            "players": player_summaries
        }

    @staticmethod
    def _verify_all_players_submitted(game_id: int, round_number: int):
        """
        Verify all active players submitted production plans

        Raises:
            ValueError: If any player hasn't submitted
        """
        players = Player.query.filter_by(game_id=game_id, is_active=True).all()

        for player in players:
            productions = RoundProduction.query.filter_by(
                player_id=player.id,
                round_number=round_number
            ).all()

            if not productions:
                raise ValueError(
                    f"Player {player.nickname} (ID: {player.id}) has not submitted production plan for round {round_number}"
                )

    @staticmethod
    def _update_player_revenue(game_id: int, round_number: int):
        """
        Update player cash with revenue from sales

        Args:
            game_id: Game ID
            round_number: Round number
        """
        players = Player.query.filter_by(game_id=game_id, is_active=True).all()

        for player in players:
            # Get all productions for this round
            productions = RoundProduction.query.filter_by(
                player_id=player.id,
                round_number=round_number
            ).all()

            # Calculate total revenue
            total_revenue = sum(float(p.revenue) for p in productions)

            # Update player cash
            player.cash += total_revenue

        db.session.commit()

    @staticmethod
    def calculate_round_expenses(player_id: int, round_number: int) -> Dict[str, float]:
        """
        Calculate all expenses for a player in a round

        Expenses include:
        - Rent (from shop)
        - Salary (from employees)
        - Materials (from production submissions)
        - Decoration (if decorated this round)
        - Market research (if performed)
        - Advertisement (if performed)
        - Product research (if performed)

        Args:
            player_id: Player ID
            round_number: Round number

        Returns:
            {
                "rent": 0.0,
                "salary": 0.0,
                "material": 0.0,
                "decoration": 0.0,
                "market_research": 0.0,
                "advertisement": 0.0,
                "product_research": 0.0,
                "total": 0.0
            }
        """
        from app.models.finance import MarketAction, ResearchLog

        player = Player.query.get(player_id)
        if not player:
            raise ValueError(f"Player {player_id} not found")

        expenses = {
            "rent": 0.0,
            "salary": 0.0,
            "material": 0.0,
            "decoration": 0.0,
            "market_research": 0.0,
            "advertisement": 0.0,
            "product_research": 0.0
        }

        # 1. Rent expense
        if player.shop:
            expenses["rent"] = float(player.shop.rent) if player.shop.rent else 0.0

        # 2. Salary expense
        if player.shop:
            employees = Employee.query.filter_by(
                shop_id=player.shop.id,
                is_active=True
            ).all()
            expenses["salary"] = sum(float(emp.salary) for emp in employees)

        # 3. Material expense (already deducted during production submission)
        # We need to track this separately
        # For now, this will be 0 as material costs are deducted immediately
        expenses["material"] = 0.0

        # 4. Market actions (advertisement, market research)
        market_actions = MarketAction.query.filter_by(
            player_id=player_id,
            round_number=round_number
        ).all()

        for action in market_actions:
            if action.action_type == 'ad':
                expenses["advertisement"] += float(action.cost)
            elif action.action_type == 'research':
                expenses["market_research"] += float(action.cost)

        # 5. Product research
        research_logs = ResearchLog.query.filter_by(
            player_id=player_id,
            round_number=round_number
        ).all()

        expenses["product_research"] = sum(float(r.cost) for r in research_logs)

        # Calculate total
        expenses["total"] = sum(expenses.values())

        return expenses


# Export
__all__ = ['RoundService']
