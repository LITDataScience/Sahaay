# SPDX-Header-Start
# SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
# © 2025 Sahaay Technologies Pvt. Ltd. All rights reserved.
# SPDX-Header-End

"""
Sahaay MCP System - Usage Examples
======================================

Comprehensive examples showing how to use the DSPy-enhanced MCP system
for various Sahaay development tasks and workflows.
"""

import asyncio
import json
from datetime import datetime
from typing import Dict, Any

# Example imports (in real usage, these would be from the installed package)
from mcp_dspy.orchestrator import MCPOrchestrator, WorkflowType
from mcp_dspy.agents import *
from mcp_dspy.evaluators import MCPEvaluationSuite
from mcp_dspy.optimizers import MCPOptimizationSuite


async def example_1_basic_task_orchestration():
    """
    Example 1: Basic task orchestration
    Demonstrates how to assign and orchestrate a simple development task
    """
    print(" Example 1: Basic Task Orchestration")
    print("-" * 50)
    
    # Initialize MCP Orchestrator
    orchestrator = MCPOrchestrator()
    
    # Define a task request
    task_request = """
    Implement a new feature for the Sahaay mobile app:
    
    Feature: Item Search with Filters
    - Add search bar to home screen
    - Implement category filters (Electronics, Tools, Books, etc.)
    - Add location-based filtering (within 1km, 2km, 5km)
    - Include price range filters
    - Show search results with sorting options
    
    Requirements:
    - Use React Native components
    - Integrate with existing API endpoints
    - Follow Sahaay design system
    - Include unit tests
    - Ensure accessibility compliance
    """
    
    # Orchestrate the task
    result = orchestrator.forward(task_request, "feature_development")
    
    print(f"Task assigned to: {result['assigned_agent']}")
    print(f"Estimated effort: {result['estimated_effort']}")
    print(f"Task breakdown: {result['task_breakdown']}")
    
    return result


async def example_2_workflow_execution():
    """
    Example 2: Complete workflow execution
    Demonstrates end-to-end workflow execution for a sprint planning cycle
    """
    print("\n Example 2: Sprint Planning Workflow")
    print("-" * 50)
    
    orchestrator = MCPOrchestrator()
    
    # Execute sprint planning workflow
    workflow_id = f"sprint_planning_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    workflow_result = await orchestrator.execute_workflow(
        workflow_id,
        WorkflowType.SPRINT_PLANNING
    )
    
    print(f"Workflow ID: {workflow_result['workflow_id']}")
    print(f"Status: {workflow_result['status']}")
    print(f"Type: {workflow_result['type']}")
    
    return workflow_result


async def example_3_agent_specialization():
    """
    Example 3: Using specialized agents
    Demonstrates how different agents handle their specific domains
    """
    print("\n Example 3: Specialized Agent Usage")
    print("-" * 50)
    
    # Frontend Agent Example
    frontend_agent = FrontendAgent()
    
    frontend_task = {
        "user_story": "As a user, I want to see nearby available items on a map view",
        "design_specs": "Map component with item markers, filter controls, item details popup",
        "api_contracts": "GET /items?lat=&lng=&radius= returns items with location data"
    }
    
    frontend_result = frontend_agent.forward(**frontend_task)
    print("Frontend Agent Result:")
    print(f"- Implementation Plan: {frontend_result['implementation_plan'][:100]}...")
    print(f"- Technology Stack: {frontend_result['technology_stack']}")
    
    # Backend Agent Example
    backend_agent = BackendAgent()
    
    backend_task = {
        "api_requirements": "Create API endpoint for item search with geospatial filtering",
        "database_schema": "items table with location (lat, lng), categories table",
        "business_logic": "Filter items by distance, category, availability, price range"
    }
    
    backend_result = backend_agent.forward(**backend_task)
    print("\nBackend Agent Result:")
    print(f"- API Endpoints: {backend_result['api_endpoints'][:100]}...")
    print(f"- Technology Stack: {backend_result['technology_stack']}")
    
    return {
        "frontend": frontend_result,
        "backend": backend_result
    }


async def example_4_quality_evaluation():
    """
    Example 4: Quality evaluation and assessment
    Demonstrates how to evaluate task deliverables and system performance
    """
    print("\n Example 4: Quality Evaluation")
    print("-" * 50)
    
    orchestrator = MCPOrchestrator()
    evaluation_suite = MCPEvaluationSuite()
    
    # Create a mock task for evaluation
    task_id = "task_001"
    deliverable = """
    Implementation completed for item search feature:
    
    Components Created:
    - SearchBar.tsx: Search input with debounced API calls
    - FilterPanel.tsx: Category and location filters
    - SearchResults.tsx: Results list with sorting
    - MapView.tsx: Map component with item markers
    
    API Integration:
    - Connected to /items/search endpoint
    - Implemented geolocation services
    - Added error handling and loading states
    
    Testing:
    - Unit tests for all components (95% coverage)
    - Integration tests for API calls
    - Accessibility tests passed
    
    Documentation:
    - Component documentation updated
    - API usage examples added
    """
    
    # Evaluate the deliverable
    evaluation_result = await orchestrator.evaluate_deliverable(task_id, deliverable)
    
    print(f"Task ID: {evaluation_result['task_id']}")
    print(f"Quality Score: {evaluation_result['quality_score']}")
    print(f"Status: {evaluation_result['status']}")
    print(f"Passed: {evaluation_result['passed']}")
    
    if evaluation_result['failed_criteria']:
        print(f"Failed Criteria: {evaluation_result['failed_criteria']}")
    
    if evaluation_result['improvements']:
        print(f"Improvement Suggestions: {evaluation_result['improvements']}")
    
    return evaluation_result


async def example_5_system_optimization():
    """
    Example 5: System optimization
    Demonstrates how to optimize agent performance and system efficiency
    """
    print("\n Example 5: System Optimization")
    print("-" * 50)
    
    orchestrator = MCPOrchestrator()
    
    # Create agent modules for optimization
    agent_modules = {
        "frontend_agent": FrontendAgent(),
        "backend_agent": BackendAgent(),
        "ml_agent": MLAgent()
    }
    
    optimization_suite = MCPOptimizationSuite(agent_modules)
    
    # Mock training data for prompt optimization
    training_data = {
        "frontend_agent": [
            {
                "inputs": {
                    "user_story": "Create a login screen",
                    "design_specs": "Simple form with email and password",
                    "api_contracts": "POST /auth/login"
                },
                "outputs": {
                    "implementation_plan": "Create LoginScreen component with form validation",
                    "component_structure": "LoginScreen -> LoginForm -> InputField components"
                }
            }
        ]
    }
    
    # Configuration for comprehensive optimization
    optimization_config = {
        "optimize_prompts": True,
        "optimize_workflows": True,
        "optimize_hyperparameters": False,  # Skip for this example
        "agents_to_optimize": ["frontend_agent"],
        "training_data": training_data,
        "historical_data": [],  # Would contain real historical data
        "agent_capabilities": {
            "frontend_agent": ["react_native", "typescript", "ui_design"],
            "backend_agent": ["nodejs", "api_development", "database"]
        }
    }
    
    # Run optimization (this would be async in real usage)
    print("Running system optimization...")
    optimization_result = await optimization_suite.run_comprehensive_optimization(optimization_config)
    
    print(f"Optimization Status: {optimization_result['status']}")
    print(f"Optimization Type: {optimization_result['optimization_type']}")
    
    if 'improvements' in optimization_result:
        print("Improvements:")
        for component, improvement in optimization_result['improvements'].items():
            print(f"- {component}: {improvement:.3f}")
    
    return optimization_result


async def example_6_real_world_scenario():
    """
    Example 6: Real-world development scenario
    Demonstrates a complete development cycle for a new Sahaay feature
    """
    print("\n Example 6: Real-World Development Scenario")
    print("-" * 50)
    print("Scenario: Adding payment integration to Sahaay")
    
    orchestrator = MCPOrchestrator()
    
    # Step 1: Product planning
    print("\n1. Product Planning Phase")
    owner_agent = OwnerAgent()
    
    planning_input = {
        "market_research": "Users want secure UPI payments with escrow for deposits",
        "business_goals": "Enable secure payments, reduce payment disputes by 80%",
        "technical_constraints": "Must integrate with existing backend, comply with PCI DSS"
    }
    
    backlog_result = owner_agent.forward(**planning_input)
    print(f"Generated user stories: {len(backlog_result['user_stories'].splitlines())} stories")
    
    # Step 2: Technical implementation
    print("\n2. Technical Implementation Phase")
    
    # Trust agent handles payment security
    trust_agent = TrustAgent()
    
    payment_input = {
        "payment_requirements": "UPI integration with escrow for security deposits",
        "security_policies": "PCI DSS compliance, fraud detection, secure token storage",
        "integration_specs": "Razorpay/PayU integration, webhook handling, refund processing"
    }
    
    payment_result = trust_agent.forward(**payment_input)
    print(f"Payment flow designed: {payment_result['payment_flow'][:100]}...")
    
    # Frontend implementation
    frontend_agent = FrontendAgent()
    
    frontend_input = {
        "user_story": "User can make secure payments for item bookings",
        "design_specs": "Payment screen with UPI options, security indicators",
        "api_contracts": "Payment APIs with webhook support"
    }
    
    frontend_result = frontend_agent.forward(**frontend_input)
    print(f"Frontend components: {frontend_result['component_structure'][:100]}...")
    
    # Step 3: Quality assurance
    print("\n3. Quality Assurance Phase")
    
    qa_agent = QAAgent()
    
    qa_input = {
        "code_changes": "Payment integration with frontend and backend changes",
        "test_requirements": "Security testing, integration testing, user acceptance testing",
        "acceptance_criteria": "Payments work end-to-end, security tests pass, user experience is smooth"
    }
    
    qa_result = qa_agent.forward(**qa_input)
    print(f"Test plan created: {qa_result['test_plan'][:100]}...")
    
    # Step 4: System evaluation
    print("\n4. System Evaluation")
    
    # Simulate evaluation of the complete feature
    feature_deliverable = """
    Payment Integration Feature Completed:
    
    Backend Implementation:
    - Razorpay integration with webhook handling
    - Secure token storage and PCI compliance
    - Escrow logic for deposits and refunds
    - Fraud detection and monitoring
    
    Frontend Implementation:
    - Payment screen with UPI options
    - Security indicators and progress tracking
    - Error handling and user feedback
    - Accessibility compliance
    
    Security & Testing:
    - Security audit passed
    - Integration tests cover all payment flows
    - User acceptance testing completed
    - Performance testing shows <2s payment processing
    
    Documentation:
    - API documentation updated
    - Security guidelines documented
    - User guides created
    """
    
    evaluation_result = await orchestrator.evaluate_deliverable("payment_feature", feature_deliverable)
    
    print(f"Feature Quality Score: {evaluation_result['quality_score']}")
    print(f"Feature Status: {evaluation_result['status']}")
    
    return {
        "planning": backlog_result,
        "payment_security": payment_result,
        "frontend": frontend_result,
        "qa": qa_result,
        "evaluation": evaluation_result
    }


async def main():
    """Run all examples"""
    print(" Sahaay MCP System - Usage Examples")
    print("=" * 60)
    
    try:
        # Run examples
        await example_1_basic_task_orchestration()
        await example_2_workflow_execution()
        await example_3_agent_specialization()
        await example_4_quality_evaluation()
        await example_5_system_optimization()
        await example_6_real_world_scenario()
        
        print("\n All examples completed successfully!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n Example execution failed: {str(e)}")


if __name__ == "__main__":
    # Note: In real usage, you would configure DSPy first
    # dspy.settings.configure(lm=dspy.OpenAI(model="gpt-3.5-turbo"))
    
    asyncio.run(main())





