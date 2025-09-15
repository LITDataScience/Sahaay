# SPDX-Header-Start
# SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
# © 2025 Sitaram Technologies Pvt. Ltd. All rights reserved.
# SPDX-Header-End

"""
DSPy-Powered MCP Orchestrator for Sahaay
=============================================

The Master Control Program (MCP) orchestrator using DSPy framework for
intelligent task assignment, workflow management, and quality assurance.
"""

import dspy
import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from enum import Enum
from dataclasses import dataclass, asdict
from .signatures import (
    TaskAssignmentSignature,
    QualityGateSignature, 
    WorkflowOrchestrationSignature,
    TaskRequest,
    TaskResponse
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TaskStatus(Enum):
    """Task execution status"""
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    BLOCKED = "blocked"
    CANCELLED = "cancelled"


class WorkflowType(Enum):
    """Supported workflow types"""
    SPRINT_PLANNING = "sprint_planning"
    FEATURE_DEVELOPMENT = "feature_development"
    BUG_FIX = "bug_fix"
    RELEASE = "release"
    HOTFIX = "hotfix"
    INFRASTRUCTURE = "infrastructure"


@dataclass
class AgentCapability:
    """Agent capability definition"""
    agent_id: str
    name: str
    skills: List[str]
    max_concurrent_tasks: int
    current_workload: int
    expertise_level: float  # 0.0 to 1.0
    availability: bool = True


@dataclass
class Task:
    """Enhanced task representation"""
    task_id: str
    title: str
    description: str
    task_type: str
    priority: str
    requirements: List[str]
    acceptance_criteria: List[str]
    assigned_agent: Optional[str] = None
    status: TaskStatus = TaskStatus.PENDING
    created_at: datetime = None
    updated_at: datetime = None
    deadline: Optional[datetime] = None
    dependencies: List[str] = None
    artifacts: List[str] = None
    test_results: List[Dict] = None
    retry_count: int = 0
    max_retries: int = 2

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
        if self.updated_at is None:
            self.updated_at = datetime.now()
        if self.dependencies is None:
            self.dependencies = []
        if self.artifacts is None:
            self.artifacts = []
        if self.test_results is None:
            self.test_results = []


class MCPOrchestrator(dspy.Module):
    """
    DSPy-powered Master Control Program Orchestrator
    
    Coordinates specialized agents using DSPy signatures for:
    - Intelligent task assignment
    - Quality gate enforcement
    - Workflow orchestration
    - Performance optimization
    """

    def __init__(self, model_name: str = "gpt-3.5-turbo"):
        super().__init__()
        
        # Initialize DSPy modules
        self.task_assigner = dspy.ChainOfThought(TaskAssignmentSignature)
        self.quality_gate = dspy.ChainOfThought(QualityGateSignature)
        self.workflow_orchestrator = dspy.ChainOfThought(WorkflowOrchestrationSignature)
        
        # Agent registry and state management
        self.agents: Dict[str, AgentCapability] = {}
        self.tasks: Dict[str, Task] = {}
        self.workflows: Dict[str, Dict] = {}
        
        # Performance metrics
        self.metrics = {
            "tasks_completed": 0,
            "tasks_failed": 0,
            "average_completion_time": 0.0,
            "quality_score_avg": 0.0,
            "agent_utilization": {}
        }
        
        # Configuration
        self.max_concurrent_workflows = 5
        self.default_task_timeout = timedelta(hours=6)
        
        # Register default agents
        self._register_default_agents()
        
        logger.info("MCP Orchestrator initialized with DSPy framework")

    def _register_default_agents(self):
        """Register the default Sahaay agents"""
        default_agents = [
            AgentCapability("owner_agent", "Product Owner", 
                          ["product_management", "backlog_prioritization", "user_stories"], 3, 0, 0.9),
            AgentCapability("frontend_agent", "Frontend Developer", 
                          ["react_native", "typescript", "mobile_ui", "testing"], 2, 0, 0.85),
            AgentCapability("backend_agent", "Backend Developer", 
                          ["nodejs", "typescript", "api_development", "database"], 2, 0, 0.85),
            AgentCapability("trust_agent", "Trust & Payments", 
                          ["payments", "security", "escrow", "compliance"], 2, 0, 0.8),
            AgentCapability("logistics_agent", "Logistics Optimizer", 
                          ["scheduling", "routing", "optimization"], 2, 0, 0.75),
            AgentCapability("ml_agent", "ML Engineer", 
                          ["machine_learning", "recommendations", "fraud_detection"], 1, 0, 0.9),
            AgentCapability("qa_agent", "Quality Assurance", 
                          ["testing", "quality_assurance", "automation"], 3, 0, 0.8),
            AgentCapability("infra_agent", "Infrastructure", 
                          ["devops", "deployment", "monitoring", "scaling"], 2, 0, 0.8),
            AgentCapability("growth_agent", "Growth Marketing", 
                          ["marketing", "growth_hacking", "analytics"], 2, 0, 0.7),
            AgentCapability("legal_agent", "Legal Compliance", 
                          ["legal", "compliance", "documentation"], 1, 0, 0.85),
            AgentCapability("design_agent", "UI/UX Design", 
                          ["design", "user_experience", "prototyping"], 2, 0, 0.8)
        ]
        
        for agent in default_agents:
            self.agents[agent.agent_id] = agent

    def forward(self, task_request: str, workflow_type: str = "feature_development") -> Dict[str, Any]:
        """
        Main DSPy forward method for processing task requests
        
        Args:
            task_request: Detailed task description
            workflow_type: Type of workflow to execute
            
        Returns:
            Orchestration result with task assignments and workflow plan
        """
        try:
            # Parse and create task
            task = self._create_task_from_request(task_request)
            
            # Assign task to best agent
            assignment_result = self.task_assigner(
                task_description=task.description,
                available_agents=self._get_agent_summary(),
                current_workload=self._get_workload_summary()
            )
            
            # Update task with assignment
            task.assigned_agent = assignment_result.assigned_agent
            task.status = TaskStatus.ASSIGNED
            self.tasks[task.task_id] = task
            
            # Update agent workload
            if task.assigned_agent in self.agents:
                self.agents[task.assigned_agent].current_workload += 1
            
            # Orchestrate workflow
            workflow_result = self.workflow_orchestrator(
                workflow_type=workflow_type,
                current_state=f"Task {task.task_id} assigned to {task.assigned_agent}",
                agent_statuses=self._get_agent_statuses()
            )
            
            result = {
                "task_id": task.task_id,
                "assigned_agent": task.assigned_agent,
                "task_breakdown": assignment_result.task_breakdown,
                "estimated_effort": assignment_result.estimated_effort,
                "dependencies": assignment_result.dependencies,
                "workflow_status": workflow_result.workflow_status,
                "next_actions": workflow_result.next_actions,
                "timeline": workflow_result.timeline_update,
                "blocking_issues": workflow_result.blocking_issues
            }
            
            logger.info(f"Task {task.task_id} orchestrated successfully")
            return result
            
        except Exception as e:
            logger.error(f"Orchestration failed: {str(e)}")
            return {"error": str(e), "status": "failed"}

    async def execute_workflow(self, workflow_id: str, workflow_type: WorkflowType) -> Dict[str, Any]:
        """
        Execute a complete workflow asynchronously
        
        Args:
            workflow_id: Unique workflow identifier
            workflow_type: Type of workflow to execute
            
        Returns:
            Workflow execution results
        """
        workflow = {
            "id": workflow_id,
            "type": workflow_type.value,
            "status": "running",
            "started_at": datetime.now(),
            "tasks": [],
            "results": {}
        }
        
        self.workflows[workflow_id] = workflow
        
        try:
            if workflow_type == WorkflowType.SPRINT_PLANNING:
                return await self._execute_sprint_planning(workflow_id)
            elif workflow_type == WorkflowType.FEATURE_DEVELOPMENT:
                return await self._execute_feature_development(workflow_id)
            elif workflow_type == WorkflowType.RELEASE:
                return await self._execute_release_workflow(workflow_id)
            else:
                return await self._execute_generic_workflow(workflow_id)
                
        except Exception as e:
            workflow["status"] = "failed"
            workflow["error"] = str(e)
            logger.error(f"Workflow {workflow_id} failed: {str(e)}")
            return workflow

    async def evaluate_deliverable(self, task_id: str, deliverable: str) -> Dict[str, Any]:
        """
        Evaluate a completed deliverable using DSPy quality gates
        
        Args:
            task_id: Task identifier
            deliverable: The completed work to evaluate
            
        Returns:
            Quality evaluation results
        """
        if task_id not in self.tasks:
            return {"error": "Task not found", "task_id": task_id}
        
        task = self.tasks[task_id]
        
        try:
            # Run quality gate evaluation
            quality_result = self.quality_gate(
                deliverable=deliverable,
                acceptance_criteria="\n".join(task.acceptance_criteria),
                quality_standards=self._get_quality_standards(task.task_type)
            )
            
            # Update task with evaluation results
            task.test_results.append({
                "timestamp": datetime.now().isoformat(),
                "quality_score": quality_result.quality_score,
                "passed_criteria": quality_result.passed_criteria,
                "failed_criteria": quality_result.failed_criteria,
                "improvements": quality_result.improvement_suggestions
            })
            
            # Determine if task passes quality gate
            quality_score = float(quality_result.quality_score)
            if quality_score >= 80:  # 80% threshold
                task.status = TaskStatus.COMPLETED
                self.metrics["tasks_completed"] += 1
                logger.info(f"Task {task_id} passed quality gate with score {quality_score}")
            else:
                task.status = TaskStatus.FAILED
                task.retry_count += 1
                self.metrics["tasks_failed"] += 1
                logger.warning(f"Task {task_id} failed quality gate with score {quality_score}")
            
            # Update metrics
            self._update_quality_metrics(quality_score)
            
            return {
                "task_id": task_id,
                "quality_score": quality_score,
                "status": task.status.value,
                "passed": quality_score >= 80,
                "passed_criteria": quality_result.passed_criteria,
                "failed_criteria": quality_result.failed_criteria,
                "improvements": quality_result.improvement_suggestions,
                "retry_count": task.retry_count
            }
            
        except Exception as e:
            logger.error(f"Quality evaluation failed for task {task_id}: {str(e)}")
            return {"error": str(e), "task_id": task_id}

    def get_system_status(self) -> Dict[str, Any]:
        """Get comprehensive system status and metrics"""
        return {
            "orchestrator_status": "active",
            "total_agents": len(self.agents),
            "active_tasks": len([t for t in self.tasks.values() if t.status == TaskStatus.IN_PROGRESS]),
            "completed_tasks": len([t for t in self.tasks.values() if t.status == TaskStatus.COMPLETED]),
            "failed_tasks": len([t for t in self.tasks.values() if t.status == TaskStatus.FAILED]),
            "active_workflows": len([w for w in self.workflows.values() if w["status"] == "running"]),
            "metrics": self.metrics,
            "agent_utilization": self._calculate_agent_utilization(),
            "system_health": self._assess_system_health()
        }

    def optimize_performance(self) -> Dict[str, Any]:
        """
        Optimize system performance using DSPy optimization techniques
        
        Returns:
            Optimization results and recommendations
        """
        try:
            # Analyze current performance
            performance_data = self._analyze_performance()
            
            # Generate optimization recommendations
            recommendations = []
            
            # Agent workload balancing
            if performance_data["workload_imbalance"] > 0.3:
                recommendations.append({
                    "type": "workload_balancing",
                    "description": "Redistribute tasks to balance agent workloads",
                    "priority": "high"
                })
            
            # Quality improvement
            if performance_data["avg_quality_score"] < 85:
                recommendations.append({
                    "type": "quality_improvement",
                    "description": "Implement additional quality checks and training",
                    "priority": "medium"
                })
            
            # Task completion optimization
            if performance_data["avg_completion_time"] > 4:  # hours
                recommendations.append({
                    "type": "efficiency_improvement",
                    "description": "Optimize task breakdown and dependencies",
                    "priority": "medium"
                })
            
            return {
                "performance_analysis": performance_data,
                "recommendations": recommendations,
                "optimization_status": "completed",
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Performance optimization failed: {str(e)}")
            return {"error": str(e), "status": "failed"}

    # === Private Helper Methods ===

    def _create_task_from_request(self, task_request: str) -> Task:
        """Create a Task object from a request string"""
        # In a real implementation, this would parse structured input
        # For now, we'll create a basic task
        import uuid
        
        task_id = str(uuid.uuid4())[:8]
        return Task(
            task_id=task_id,
            title=f"Task {task_id}",
            description=task_request,
            task_type="feature_development",
            priority="medium",
            requirements=[task_request],
            acceptance_criteria=["Implementation meets requirements", "Code passes tests", "Documentation updated"]
        )

    def _get_agent_summary(self) -> str:
        """Get summary of available agents and their capabilities"""
        agent_info = []
        for agent in self.agents.values():
            if agent.availability and agent.current_workload < agent.max_concurrent_tasks:
                agent_info.append(f"{agent.name}: {', '.join(agent.skills)} (expertise: {agent.expertise_level})")
        return "\n".join(agent_info)

    def _get_workload_summary(self) -> str:
        """Get current workload summary for all agents"""
        workload_info = []
        for agent in self.agents.values():
            utilization = agent.current_workload / agent.max_concurrent_tasks
            workload_info.append(f"{agent.name}: {agent.current_workload}/{agent.max_concurrent_tasks} ({utilization:.1%})")
        return "\n".join(workload_info)

    def _get_agent_statuses(self) -> str:
        """Get current status of all agents"""
        status_info = []
        for agent in self.agents.values():
            status = "available" if agent.availability and agent.current_workload < agent.max_concurrent_tasks else "busy"
            status_info.append(f"{agent.name}: {status}")
        return "\n".join(status_info)

    def _get_quality_standards(self, task_type: str) -> str:
        """Get quality standards for a specific task type"""
        standards = {
            "feature_development": "Code follows best practices, has unit tests, passes linting, includes documentation",
            "bug_fix": "Fix addresses root cause, includes regression tests, doesn't break existing functionality",
            "infrastructure": "Changes are backward compatible, include monitoring, follow security guidelines"
        }
        return standards.get(task_type, "Meets acceptance criteria and follows general quality guidelines")

    def _update_quality_metrics(self, quality_score: float):
        """Update quality metrics with new score"""
        current_avg = self.metrics["quality_score_avg"]
        total_tasks = self.metrics["tasks_completed"] + self.metrics["tasks_failed"]
        
        if total_tasks > 0:
            self.metrics["quality_score_avg"] = (current_avg * (total_tasks - 1) + quality_score) / total_tasks

    def _calculate_agent_utilization(self) -> Dict[str, float]:
        """Calculate utilization percentage for each agent"""
        utilization = {}
        for agent_id, agent in self.agents.items():
            utilization[agent_id] = agent.current_workload / agent.max_concurrent_tasks
        return utilization

    def _assess_system_health(self) -> str:
        """Assess overall system health"""
        total_tasks = self.metrics["tasks_completed"] + self.metrics["tasks_failed"]
        if total_tasks == 0:
            return "healthy"
        
        success_rate = self.metrics["tasks_completed"] / total_tasks
        avg_quality = self.metrics["quality_score_avg"]
        
        if success_rate >= 0.9 and avg_quality >= 85:
            return "excellent"
        elif success_rate >= 0.8 and avg_quality >= 75:
            return "good"
        elif success_rate >= 0.7 and avg_quality >= 65:
            return "fair"
        else:
            return "needs_attention"

    def _analyze_performance(self) -> Dict[str, float]:
        """Analyze current system performance"""
        utilizations = list(self._calculate_agent_utilization().values())
        
        return {
            "avg_quality_score": self.metrics["quality_score_avg"],
            "task_success_rate": self.metrics["tasks_completed"] / max(1, self.metrics["tasks_completed"] + self.metrics["tasks_failed"]),
            "avg_completion_time": self.metrics["average_completion_time"],
            "workload_imbalance": max(utilizations) - min(utilizations) if utilizations else 0,
            "system_utilization": sum(utilizations) / len(utilizations) if utilizations else 0
        }

    async def _execute_sprint_planning(self, workflow_id: str) -> Dict[str, Any]:
        """Execute sprint planning workflow"""
        # Implementation would coordinate with owner_agent for backlog creation
        # and distribute tasks to appropriate agents
        return {"workflow_id": workflow_id, "status": "completed", "type": "sprint_planning"}

    async def _execute_feature_development(self, workflow_id: str) -> Dict[str, Any]:
        """Execute feature development workflow"""
        # Implementation would coordinate frontend, backend, and QA agents
        return {"workflow_id": workflow_id, "status": "completed", "type": "feature_development"}

    async def _execute_release_workflow(self, workflow_id: str) -> Dict[str, Any]:
        """Execute release workflow"""
        # Implementation would coordinate testing, deployment, and monitoring
        return {"workflow_id": workflow_id, "status": "completed", "type": "release"}

    async def _execute_generic_workflow(self, workflow_id: str) -> Dict[str, Any]:
        """Execute generic workflow"""
        return {"workflow_id": workflow_id, "status": "completed", "type": "generic"}



