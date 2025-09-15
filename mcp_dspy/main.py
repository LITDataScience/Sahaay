# SPDX-Header-Start
# SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
# © 2025 Sitaram Technologies Pvt. Ltd. All rights reserved.
# SPDX-Header-End

"""
Sahaay MCP System - DSPy Enhanced Main Entry Point
======================================================

Main application entry point for the DSPy-powered Master Control Program.
Provides API endpoints, real-time orchestration, and system management.
"""

import asyncio
import logging
import uvicorn
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Dict, List, Any, Optional
from datetime import datetime
import dspy

from .orchestrator import MCPOrchestrator, WorkflowType, TaskStatus
from .agents import *
from .evaluators import MCPEvaluationSuite
from .optimizers import MCPOptimizationSuite
from .signatures import TaskRequest, TaskResponse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global system state
mcp_orchestrator: Optional[MCPOrchestrator] = None
evaluation_suite: Optional[MCPEvaluationSuite] = None
optimization_suite: Optional[MCPOptimizationSuite] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    # Startup
    logger.info("Starting Sahaay MCP System with DSPy...")
    
    # Initialize DSPy with default language model
    try:
        # Configure DSPy with OpenAI GPT-3.5-turbo (or local model)
        dspy.settings.configure(lm=dspy.OpenAI(model="gpt-3.5-turbo", max_tokens=1000))
        logger.info("DSPy configured successfully")
    except Exception as e:
        logger.warning(f"DSPy configuration failed, using default: {str(e)}")
        # Fallback to dummy LM for testing
        dspy.settings.configure(lm=dspy.OpenAI(model="gpt-3.5-turbo", max_tokens=1000))
    
    # Initialize global components
    global mcp_orchestrator, evaluation_suite, optimization_suite
    
    # Create agent modules
    agent_modules = {
        "owner_agent": OwnerAgent(),
        "frontend_agent": FrontendAgent(),
        "backend_agent": BackendAgent(),
        "trust_agent": TrustAgent(),
        "logistics_agent": LogisticsAgent(),
        "ml_agent": MLAgent(),
        "qa_agent": QAAgent(),
        "infra_agent": InfraAgent(),
        "growth_agent": GrowthAgent(),
        "legal_agent": LegalAgent(),
        "design_agent": DesignAgent()
    }
    
    # Initialize MCP components
    mcp_orchestrator = MCPOrchestrator()
    evaluation_suite = MCPEvaluationSuite()
    optimization_suite = MCPOptimizationSuite(agent_modules)
    
    logger.info("MCP System initialized successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down MCP System...")


# Create FastAPI app
app = FastAPI(
    title="Sahaay MCP System",
    description="DSPy-powered Master Control Program for Sahaay",
    version="2.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# === API Endpoints ===

@app.get("/")
async def root():
    """Root endpoint with system information"""
    return {
        "service": "Sahaay MCP System",
        "version": "2.0.0",
        "framework": "DSPy Enhanced",
        "status": "active",
        "timestamp": datetime.now().isoformat(),
        "endpoints": {
            "task_orchestration": "/orchestrate",
            "system_status": "/status",
            "agent_performance": "/agents/performance",
            "evaluation": "/evaluate",
            "optimization": "/optimize"
        }
    }


@app.post("/orchestrate")
async def orchestrate_task(task_request: Dict[str, Any]):
    """
    Orchestrate a new task through the MCP system
    
    Args:
        task_request: Task details including description, type, and requirements
        
    Returns:
        Orchestration result with task assignment and workflow plan
    """
    try:
        if not mcp_orchestrator:
            raise HTTPException(status_code=503, detail="MCP Orchestrator not initialized")
        
        task_description = task_request.get("description", "")
        workflow_type = task_request.get("workflow_type", "feature_development")
        
        if not task_description:
            raise HTTPException(status_code=400, detail="Task description is required")
        
        # Orchestrate the task
        result = mcp_orchestrator.forward(task_description, workflow_type)
        
        return {
            "status": "success",
            "orchestration_result": result,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Task orchestration failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/orchestrate/workflow")
async def execute_workflow(workflow_request: Dict[str, Any], background_tasks: BackgroundTasks):
    """
    Execute a complete workflow asynchronously
    
    Args:
        workflow_request: Workflow configuration and parameters
        
    Returns:
        Workflow execution status and ID
    """
    try:
        if not mcp_orchestrator:
            raise HTTPException(status_code=503, detail="MCP Orchestrator not initialized")
        
        workflow_id = workflow_request.get("workflow_id", f"workflow_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
        workflow_type_str = workflow_request.get("type", "feature_development")
        
        # Convert string to WorkflowType enum
        try:
            workflow_type = WorkflowType(workflow_type_str)
        except ValueError:
            workflow_type = WorkflowType.FEATURE_DEVELOPMENT
        
        # Start workflow execution in background
        background_tasks.add_task(
            mcp_orchestrator.execute_workflow,
            workflow_id,
            workflow_type
        )
        
        return {
            "status": "started",
            "workflow_id": workflow_id,
            "workflow_type": workflow_type.value,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Workflow execution failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/status")
async def get_system_status():
    """Get comprehensive system status and metrics"""
    try:
        if not mcp_orchestrator:
            raise HTTPException(status_code=503, detail="MCP Orchestrator not initialized")
        
        status = mcp_orchestrator.get_system_status()
        
        return {
            "status": "success",
            "system_status": status,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Status retrieval failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/agents/performance")
async def get_agent_performance():
    """Get performance metrics for all agents"""
    try:
        if not mcp_orchestrator:
            raise HTTPException(status_code=503, detail="MCP Orchestrator not initialized")
        
        # Get agent performance data
        performance_data = {}
        for agent_id, agent in mcp_orchestrator.agents.items():
            performance_data[agent_id] = {
                "name": agent.name,
                "skills": agent.skills,
                "current_workload": agent.current_workload,
                "max_concurrent_tasks": agent.max_concurrent_tasks,
                "expertise_level": agent.expertise_level,
                "availability": agent.availability,
                "utilization": agent.current_workload / agent.max_concurrent_tasks
            }
        
        return {
            "status": "success",
            "agent_performance": performance_data,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Agent performance retrieval failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/evaluate")
async def evaluate_system(evaluation_request: Dict[str, Any]):
    """
    Run system evaluation and quality assessment
    
    Args:
        evaluation_request: Evaluation parameters and data
        
    Returns:
        Comprehensive evaluation results
    """
    try:
        if not evaluation_suite:
            raise HTTPException(status_code=503, detail="Evaluation Suite not initialized")
        
        evaluation_type = evaluation_request.get("type", "comprehensive")
        system_data = evaluation_request.get("system_data", {})
        
        if evaluation_type == "comprehensive":
            result = evaluation_suite.run_comprehensive_evaluation(system_data)
        else:
            # Handle specific evaluation types
            result = {"error": f"Evaluation type '{evaluation_type}' not supported"}
        
        return {
            "status": "success",
            "evaluation_result": result,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"System evaluation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/evaluate/deliverable")
async def evaluate_deliverable(evaluation_request: Dict[str, Any]):
    """
    Evaluate a specific task deliverable
    
    Args:
        evaluation_request: Task ID and deliverable to evaluate
        
    Returns:
        Quality evaluation results
    """
    try:
        if not mcp_orchestrator:
            raise HTTPException(status_code=503, detail="MCP Orchestrator not initialized")
        
        task_id = evaluation_request.get("task_id")
        deliverable = evaluation_request.get("deliverable")
        
        if not task_id or not deliverable:
            raise HTTPException(status_code=400, detail="Task ID and deliverable are required")
        
        result = await mcp_orchestrator.evaluate_deliverable(task_id, deliverable)
        
        return {
            "status": "success",
            "evaluation_result": result,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Deliverable evaluation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/optimize")
async def optimize_system(optimization_request: Dict[str, Any], background_tasks: BackgroundTasks):
    """
    Run system optimization
    
    Args:
        optimization_request: Optimization configuration and parameters
        
    Returns:
        Optimization execution status
    """
    try:
        if not optimization_suite:
            raise HTTPException(status_code=503, detail="Optimization Suite not initialized")
        
        optimization_type = optimization_request.get("type", "comprehensive")
        
        if optimization_type == "comprehensive":
            # Start comprehensive optimization in background
            background_tasks.add_task(
                optimization_suite.run_comprehensive_optimization,
                optimization_request
            )
        elif optimization_type == "performance":
            # Quick performance optimization
            if mcp_orchestrator:
                result = mcp_orchestrator.optimize_performance()
                return {
                    "status": "completed",
                    "optimization_result": result,
                    "timestamp": datetime.now().isoformat()
                }
        
        return {
            "status": "started",
            "optimization_type": optimization_type,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"System optimization failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/agents/{agent_id}/status")
async def get_agent_status(agent_id: str):
    """Get status of a specific agent"""
    try:
        if not mcp_orchestrator:
            raise HTTPException(status_code=503, detail="MCP Orchestrator not initialized")
        
        if agent_id not in mcp_orchestrator.agents:
            raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")
        
        agent = mcp_orchestrator.agents[agent_id]
        status = {
            "agent_id": agent_id,
            "name": agent.name,
            "skills": agent.skills,
            "current_workload": agent.current_workload,
            "max_concurrent_tasks": agent.max_concurrent_tasks,
            "expertise_level": agent.expertise_level,
            "availability": agent.availability,
            "utilization": agent.current_workload / agent.max_concurrent_tasks
        }
        
        return {
            "status": "success",
            "agent_status": status,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Agent status retrieval failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/workflows/{workflow_id}")
async def get_workflow_status(workflow_id: str):
    """Get status of a specific workflow"""
    try:
        if not mcp_orchestrator:
            raise HTTPException(status_code=503, detail="MCP Orchestrator not initialized")
        
        if workflow_id not in mcp_orchestrator.workflows:
            raise HTTPException(status_code=404, detail=f"Workflow {workflow_id} not found")
        
        workflow = mcp_orchestrator.workflows[workflow_id]
        
        return {
            "status": "success",
            "workflow_status": workflow,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Workflow status retrieval failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Sahaay MCP System",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat(),
        "components": {
            "orchestrator": mcp_orchestrator is not None,
            "evaluation": evaluation_suite is not None,
            "optimization": optimization_suite is not None
        }
    }


# === Main Application Entry Point ===

def main():
    """Main entry point for the MCP system"""
    logger.info("Starting Sahaay MCP System...")
    
    # Run the FastAPI application
    uvicorn.run(
        "mcp_dspy.main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,  # Set to True for development
        log_level="info"
    )


if __name__ == "__main__":
    main()



