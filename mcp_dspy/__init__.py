# SPDX-Header-Start
# SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
# © 2025 Sahaay Technologies Pvt. Ltd. All rights reserved.
# SPDX-Header-End

"""
Sahaay MCP System powered by DSPy
=====================================

This module implements the Master Control Program (MCP) using DSPy framework
for enhanced AI agent orchestration, evaluation, and optimization.

Key Components:
- Agent Signatures: Define input/output contracts for each agent
- MCP Orchestrator: Main coordination module using DSPy
- Agent Modules: Specialized agents with DSPy optimization
- Evaluation Framework: Metrics and assessment tools
- Optimization Pipeline: Automatic prompt and model tuning
"""

from .orchestrator import MCPOrchestrator
from .agents import (
    OwnerAgent,
    FrontendAgent, 
    BackendAgent,
    TrustAgent,
    LogisticsAgent,
    MLAgent,
    QAAgent,
    InfraAgent,
    GrowthAgent,
    LegalAgent,
    DesignAgent
)
from .signatures import *
from .evaluators import *
from .optimizers import *

__version__ = "2.0.0"
__author__ = "Sahaay Team"

__all__ = [
    "MCPOrchestrator",
    "OwnerAgent",
    "FrontendAgent", 
    "BackendAgent",
    "TrustAgent",
    "LogisticsAgent",
    "MLAgent",
    "QAAgent",
    "InfraAgent",
    "GrowthAgent",
    "LegalAgent",
    "DesignAgent"
]

