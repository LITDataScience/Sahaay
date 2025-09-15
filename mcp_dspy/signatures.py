# SPDX-Header-Start
# SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
# © 2025 Sitaram Technologies Pvt. Ltd. All rights reserved.
# SPDX-Header-End

"""
DSPy Signatures for Sahaay MCP Agents
==========================================

Defines the input/output contracts for each specialized agent using DSPy signatures.
This ensures consistent and optimizable AI interactions across the system.
"""

import dspy
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class TaskRequest(BaseModel):
    """Standard task request structure"""
    task_id: str
    task_type: str
    priority: str  # high, medium, low
    description: str
    requirements: List[str]
    acceptance_criteria: List[str]
    deadline: Optional[str] = None
    context: Dict[str, Any] = {}


class TaskResponse(BaseModel):
    """Standard task response structure"""
    task_id: str
    status: str  # completed, failed, in_progress, blocked
    deliverables: List[str]
    artifacts: List[str] = []
    test_results: List[str] = []
    issues: List[str] = []
    next_steps: List[str] = []


# === Core MCP Signatures ===

class TaskAssignmentSignature(dspy.Signature):
    """Assigns tasks to the most suitable agent based on requirements and capabilities"""
    
    task_description = dspy.InputField(desc="Detailed task description with requirements")
    available_agents = dspy.InputField(desc="List of available agents with their capabilities")
    current_workload = dspy.InputField(desc="Current workload of each agent")
    
    assigned_agent = dspy.OutputField(desc="Selected agent ID for the task")
    task_breakdown = dspy.OutputField(desc="Detailed subtasks and acceptance criteria")
    estimated_effort = dspy.OutputField(desc="Estimated effort in hours")
    dependencies = dspy.OutputField(desc="List of dependencies and prerequisites")


class QualityGateSignature(dspy.Signature):
    """Evaluates deliverables against acceptance criteria and quality standards"""
    
    deliverable = dspy.InputField(desc="The completed work or artifact to evaluate")
    acceptance_criteria = dspy.InputField(desc="List of acceptance criteria to check")
    quality_standards = dspy.InputField(desc="Quality standards and best practices")
    
    quality_score = dspy.OutputField(desc="Quality score from 0-100")
    passed_criteria = dspy.OutputField(desc="List of criteria that passed")
    failed_criteria = dspy.OutputField(desc="List of criteria that failed with reasons")
    improvement_suggestions = dspy.OutputField(desc="Specific suggestions for improvement")


class WorkflowOrchestrationSignature(dspy.Signature):
    """Orchestrates complex workflows across multiple agents"""
    
    workflow_type = dspy.InputField(desc="Type of workflow (sprint_planning, release, feature_development)")
    current_state = dspy.InputField(desc="Current state of the workflow")
    agent_statuses = dspy.InputField(desc="Status updates from all involved agents")
    
    next_actions = dspy.OutputField(desc="List of next actions to take")
    workflow_status = dspy.OutputField(desc="Overall workflow status")
    blocking_issues = dspy.OutputField(desc="Any issues blocking progress")
    timeline_update = dspy.OutputField(desc="Updated timeline and milestones")


# === Specialized Agent Signatures ===

class ProductBacklogSignature(dspy.Signature):
    """Owner Agent: Creates and prioritizes product backlog"""
    
    market_research = dspy.InputField(desc="Market research and user feedback")
    business_goals = dspy.InputField(desc="Current business goals and KPIs")
    technical_constraints = dspy.InputField(desc="Technical constraints and dependencies")
    
    user_stories = dspy.OutputField(desc="Prioritized list of user stories with acceptance criteria")
    epic_breakdown = dspy.OutputField(desc="Epic breakdown with story points")
    sprint_recommendations = dspy.OutputField(desc="Recommended sprint goals and capacity")


class FrontendImplementationSignature(dspy.Signature):
    """Frontend Agent: Implements React Native features"""
    
    user_story = dspy.InputField(desc="User story with acceptance criteria")
    design_specs = dspy.InputField(desc="UI/UX design specifications")
    api_contracts = dspy.InputField(desc="Backend API contracts and endpoints")
    
    implementation_plan = dspy.OutputField(desc="Step-by-step implementation plan")
    component_structure = dspy.OutputField(desc="React Native component structure")
    test_cases = dspy.OutputField(desc="Unit and integration test cases")
    code_artifacts = dspy.OutputField(desc="Generated code files and components")


class BackendImplementationSignature(dspy.Signature):
    """Backend Agent: Implements Node.js API features"""
    
    api_requirements = dspy.InputField(desc="API requirements and specifications")
    database_schema = dspy.InputField(desc="Database schema and relationships")
    business_logic = dspy.InputField(desc="Business logic and validation rules")
    
    api_endpoints = dspy.OutputField(desc="REST API endpoint implementations")
    database_migrations = dspy.OutputField(desc="Database migration scripts")
    test_suite = dspy.OutputField(desc="API test suite with integration tests")
    documentation = dspy.OutputField(desc="API documentation and examples")


class PaymentSecuritySignature(dspy.Signature):
    """Trust Agent: Handles payments and security"""
    
    payment_requirements = dspy.InputField(desc="Payment flow requirements")
    security_policies = dspy.InputField(desc="Security policies and compliance needs")
    integration_specs = dspy.InputField(desc="UPI and payment gateway specifications")
    
    payment_flow = dspy.OutputField(desc="Secure payment flow implementation")
    escrow_logic = dspy.OutputField(desc="Deposit escrow and refund logic")
    security_measures = dspy.OutputField(desc="Security measures and fraud detection")
    compliance_checklist = dspy.OutputField(desc="Compliance checklist and audit trail")


class LogisticsOptimizationSignature(dspy.Signature):
    """Logistics Agent: Optimizes pickup/drop scheduling"""
    
    booking_requests = dspy.InputField(desc="Current booking requests and schedules")
    driver_availability = dspy.InputField(desc="Available drivers and their locations")
    optimization_criteria = dspy.InputField(desc="Optimization criteria (cost, time, distance)")
    
    optimized_schedule = dspy.OutputField(desc="Optimized pickup/drop schedule")
    route_planning = dspy.OutputField(desc="Efficient route planning for drivers")
    cost_analysis = dspy.OutputField(desc="Cost analysis and savings estimation")
    performance_metrics = dspy.OutputField(desc="Performance metrics and KPIs")


class MLRecommendationSignature(dspy.Signature):
    """ML Agent: Provides AI-powered recommendations"""
    
    user_behavior = dspy.InputField(desc="User behavior data and preferences")
    item_catalog = dspy.InputField(desc="Available items and their metadata")
    contextual_data = dspy.InputField(desc="Location, time, and contextual information")
    
    item_recommendations = dspy.OutputField(desc="Personalized item recommendations")
    pricing_suggestions = dspy.OutputField(desc="Dynamic pricing suggestions")
    fraud_assessment = dspy.OutputField(desc="Fraud risk assessment and flags")
    reputation_scores = dspy.OutputField(desc="Updated reputation scores")


class QualityAssuranceSignature(dspy.Signature):
    """QA Agent: Ensures quality and runs tests"""
    
    code_changes = dspy.InputField(desc="Code changes and new features")
    test_requirements = dspy.InputField(desc="Test requirements and coverage goals")
    acceptance_criteria = dspy.InputField(desc="Feature acceptance criteria")
    
    test_plan = dspy.OutputField(desc="Comprehensive test plan and strategy")
    test_results = dspy.OutputField(desc="Test execution results and coverage")
    quality_report = dspy.OutputField(desc="Quality assessment report")
    bug_reports = dspy.OutputField(desc="Identified bugs and issues")


class InfrastructureSignature(dspy.Signature):
    """Infra Agent: Manages deployment and infrastructure"""
    
    deployment_requirements = dspy.InputField(desc="Deployment requirements and specifications")
    infrastructure_state = dspy.InputField(desc="Current infrastructure state and resources")
    scaling_needs = dspy.InputField(desc="Scaling requirements and performance targets")
    
    deployment_plan = dspy.OutputField(desc="Deployment plan and rollout strategy")
    infrastructure_config = dspy.OutputField(desc="Infrastructure configuration and scripts")
    monitoring_setup = dspy.OutputField(desc="Monitoring and alerting configuration")
    performance_report = dspy.OutputField(desc="Performance analysis and optimization")


class GrowthStrategySignature(dspy.Signature):
    """Growth Agent: Develops growth and marketing strategies"""
    
    market_data = dspy.InputField(desc="Market analysis and competitive landscape")
    user_metrics = dspy.InputField(desc="Current user metrics and engagement data")
    growth_goals = dspy.InputField(desc="Growth targets and business objectives")
    
    growth_strategy = dspy.OutputField(desc="Comprehensive growth strategy and tactics")
    marketing_campaigns = dspy.OutputField(desc="Marketing campaign recommendations")
    user_acquisition = dspy.OutputField(desc="User acquisition channels and strategies")
    retention_programs = dspy.OutputField(desc="User retention and engagement programs")


class LegalComplianceSignature(dspy.Signature):
    """Legal Agent: Ensures legal compliance and documentation"""
    
    regulatory_requirements = dspy.InputField(desc="Applicable regulatory requirements")
    business_operations = dspy.InputField(desc="Current business operations and processes")
    legal_risks = dspy.InputField(desc="Identified legal risks and concerns")
    
    compliance_framework = dspy.OutputField(desc="Legal compliance framework and policies")
    legal_documentation = dspy.OutputField(desc="Required legal documents and agreements")
    risk_mitigation = dspy.OutputField(desc="Risk mitigation strategies and controls")
    regulatory_updates = dspy.OutputField(desc="Regulatory compliance updates and actions")


class DesignSystemSignature(dspy.Signature):
    """Design Agent: Creates UI/UX design systems"""
    
    user_research = dspy.InputField(desc="User research and usability studies")
    brand_guidelines = dspy.InputField(desc="Brand guidelines and visual identity")
    platform_requirements = dspy.InputField(desc="Platform-specific design requirements")
    
    design_system = dspy.OutputField(desc="Comprehensive design system and components")
    user_flows = dspy.OutputField(desc="User experience flows and wireframes")
    accessibility_guidelines = dspy.OutputField(desc="Accessibility guidelines and standards")
    design_assets = dspy.OutputField(desc="Design assets and implementation guides")



