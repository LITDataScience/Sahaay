# SPDX-Header-Start
# SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
# © 2025 Sahaay Technologies Pvt. Ltd. All rights reserved.
# SPDX-Header-End

"""
DSPy Evaluation Framework for Sahaay MCP
=============================================

Comprehensive evaluation system for assessing agent performance,
system quality, and optimization effectiveness.
"""

import dspy
import numpy as np
from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime
from dataclasses import dataclass
from enum import Enum


class EvaluationMetric(Enum):
    """Available evaluation metrics"""
    ACCURACY = "accuracy"
    COMPLETENESS = "completeness"
    QUALITY = "quality"
    EFFICIENCY = "efficiency"
    CONSISTENCY = "consistency"
    RELEVANCE = "relevance"
    SECURITY = "security"
    PERFORMANCE = "performance"


@dataclass
class EvaluationResult:
    """Evaluation result structure"""
    metric: EvaluationMetric
    score: float  # 0.0 to 1.0
    details: Dict[str, Any]
    timestamp: datetime
    agent_id: Optional[str] = None
    task_id: Optional[str] = None


class TaskCompletionEvaluator(dspy.Module):
    """Evaluates task completion quality and accuracy"""
    
    def __init__(self):
        super().__init__()
        
    def forward(self, task_output: str, expected_criteria: List[str], task_type: str) -> float:
        """
        Evaluate task completion against criteria
        
        Args:
            task_output: The completed task output
            expected_criteria: List of acceptance criteria
            task_type: Type of task being evaluated
            
        Returns:
            Score between 0.0 and 1.0
        """
        try:
            # Criteria-based evaluation
            criteria_scores = []
            
            for criterion in expected_criteria:
                # Simple keyword-based matching (in production, use more sophisticated NLP)
                score = self._evaluate_criterion(task_output, criterion, task_type)
                criteria_scores.append(score)
            
            # Calculate weighted average
            if not criteria_scores:
                return 0.0
                
            return sum(criteria_scores) / len(criteria_scores)
            
        except Exception as e:
            return 0.0
    
    def _evaluate_criterion(self, output: str, criterion: str, task_type: str) -> float:
        """Evaluate a single criterion"""
        # Task type specific evaluation logic
        if task_type == "frontend":
            return self._evaluate_frontend_criterion(output, criterion)
        elif task_type == "backend":
            return self._evaluate_backend_criterion(output, criterion)
        elif task_type == "design":
            return self._evaluate_design_criterion(output, criterion)
        else:
            return self._evaluate_generic_criterion(output, criterion)
    
    def _evaluate_frontend_criterion(self, output: str, criterion: str) -> float:
        """Evaluate frontend-specific criteria"""
        frontend_keywords = {
            "component": ["component", "react", "tsx", "jsx"],
            "navigation": ["navigation", "route", "screen"],
            "styling": ["style", "css", "design", "ui"],
            "testing": ["test", "spec", "mock", "jest"]
        }
        
        return self._keyword_based_score(output, criterion, frontend_keywords)
    
    def _evaluate_backend_criterion(self, output: str, criterion: str) -> float:
        """Evaluate backend-specific criteria"""
        backend_keywords = {
            "api": ["endpoint", "route", "controller", "api"],
            "database": ["model", "schema", "migration", "query"],
            "authentication": ["auth", "jwt", "token", "login"],
            "testing": ["test", "spec", "integration", "unit"]
        }
        
        return self._keyword_based_score(output, criterion, backend_keywords)
    
    def _evaluate_design_criterion(self, output: str, criterion: str) -> float:
        """Evaluate design-specific criteria"""
        design_keywords = {
            "wireframe": ["wireframe", "mockup", "prototype"],
            "accessibility": ["accessible", "a11y", "wcag", "aria"],
            "responsive": ["responsive", "mobile", "tablet", "desktop"],
            "branding": ["brand", "color", "typography", "logo"]
        }
        
        return self._keyword_based_score(output, criterion, design_keywords)
    
    def _evaluate_generic_criterion(self, output: str, criterion: str) -> float:
        """Evaluate generic criteria"""
        # Simple relevance scoring based on keyword overlap
        criterion_words = set(criterion.lower().split())
        output_words = set(output.lower().split())
        
        if not criterion_words:
            return 0.0
            
        overlap = len(criterion_words.intersection(output_words))
        return min(1.0, overlap / len(criterion_words))
    
    def _keyword_based_score(self, output: str, criterion: str, keyword_map: Dict[str, List[str]]) -> float:
        """Calculate score based on keyword matching"""
        output_lower = output.lower()
        criterion_lower = criterion.lower()
        
        max_score = 0.0
        
        for category, keywords in keyword_map.items():
            if any(keyword in criterion_lower for keyword in keywords):
                # Check if output contains relevant keywords
                keyword_count = sum(1 for keyword in keywords if keyword in output_lower)
                category_score = min(1.0, keyword_count / len(keywords))
                max_score = max(max_score, category_score)
        
        # Base score from generic matching
        base_score = self._evaluate_generic_criterion(output, criterion)
        
        return max(max_score, base_score)


class AgentPerformanceEvaluator(dspy.Module):
    """Evaluates individual agent performance over time"""
    
    def __init__(self):
        super().__init__()
        self.task_evaluator = TaskCompletionEvaluator()
        
    def forward(self, agent_id: str, task_history: List[Dict], time_window_days: int = 30) -> Dict[str, float]:
        """
        Evaluate agent performance metrics
        
        Args:
            agent_id: Agent identifier
            task_history: Historical task data
            time_window_days: Time window for evaluation
            
        Returns:
            Performance metrics dictionary
        """
        try:
            # Filter tasks within time window
            cutoff_date = datetime.now().timestamp() - (time_window_days * 24 * 60 * 60)
            recent_tasks = [
                task for task in task_history 
                if task.get('completed_at', 0) > cutoff_date
            ]
            
            if not recent_tasks:
                return self._default_metrics()
            
            # Calculate metrics
            metrics = {}
            
            # Success rate
            successful_tasks = [t for t in recent_tasks if t.get('status') == 'completed']
            metrics['success_rate'] = len(successful_tasks) / len(recent_tasks)
            
            # Average quality score
            quality_scores = [t.get('quality_score', 0) for t in successful_tasks if t.get('quality_score')]
            metrics['avg_quality_score'] = sum(quality_scores) / len(quality_scores) if quality_scores else 0.0
            
            # Average completion time (hours)
            completion_times = [
                (t.get('completed_at', 0) - t.get('started_at', 0)) / 3600
                for t in successful_tasks 
                if t.get('completed_at') and t.get('started_at')
            ]
            metrics['avg_completion_time'] = sum(completion_times) / len(completion_times) if completion_times else 0.0
            
            # Consistency (standard deviation of quality scores)
            if len(quality_scores) > 1:
                metrics['consistency'] = 1.0 - (np.std(quality_scores) / 100)  # Normalize to 0-1
            else:
                metrics['consistency'] = 1.0
            
            # Efficiency (tasks per day)
            metrics['efficiency'] = len(recent_tasks) / time_window_days
            
            # Overall performance score
            metrics['overall_score'] = (
                metrics['success_rate'] * 0.3 +
                metrics['avg_quality_score'] / 100 * 0.3 +
                metrics['consistency'] * 0.2 +
                min(1.0, metrics['efficiency'] / 2.0) * 0.2  # Normalize efficiency
            )
            
            return metrics
            
        except Exception as e:
            return self._default_metrics()
    
    def _default_metrics(self) -> Dict[str, float]:
        """Return default metrics when evaluation fails"""
        return {
            'success_rate': 0.0,
            'avg_quality_score': 0.0,
            'avg_completion_time': 0.0,
            'consistency': 0.0,
            'efficiency': 0.0,
            'overall_score': 0.0
        }


class SystemHealthEvaluator(dspy.Module):
    """Evaluates overall system health and performance"""
    
    def __init__(self):
        super().__init__()
        self.agent_evaluator = AgentPerformanceEvaluator()
        
    def forward(self, system_metrics: Dict[str, Any], agent_data: Dict[str, List[Dict]]) -> Dict[str, Any]:
        """
        Evaluate system-wide health and performance
        
        Args:
            system_metrics: System-level metrics
            agent_data: Per-agent performance data
            
        Returns:
            Comprehensive system health report
        """
        try:
            health_report = {
                'timestamp': datetime.now().isoformat(),
                'overall_health': 'unknown',
                'health_score': 0.0,
                'metrics': {},
                'agent_performance': {},
                'recommendations': []
            }
            
            # Evaluate each agent
            agent_scores = {}
            for agent_id, task_history in agent_data.items():
                agent_metrics = self.agent_evaluator(agent_id, task_history)
                health_report['agent_performance'][agent_id] = agent_metrics
                agent_scores[agent_id] = agent_metrics['overall_score']
            
            # System-level metrics
            total_tasks = system_metrics.get('total_tasks', 0)
            completed_tasks = system_metrics.get('completed_tasks', 0)
            failed_tasks = system_metrics.get('failed_tasks', 0)
            
            if total_tasks > 0:
                system_success_rate = completed_tasks / total_tasks
                system_failure_rate = failed_tasks / total_tasks
            else:
                system_success_rate = 0.0
                system_failure_rate = 0.0
            
            # Calculate system health score
            if agent_scores:
                avg_agent_score = sum(agent_scores.values()) / len(agent_scores)
            else:
                avg_agent_score = 0.0
            
            health_score = (
                system_success_rate * 0.4 +
                (1.0 - system_failure_rate) * 0.3 +
                avg_agent_score * 0.3
            )
            
            health_report['health_score'] = health_score
            health_report['metrics'] = {
                'system_success_rate': system_success_rate,
                'system_failure_rate': system_failure_rate,
                'avg_agent_performance': avg_agent_score,
                'active_agents': len([a for a in agent_scores.values() if a > 0]),
                'total_agents': len(agent_scores)
            }
            
            # Determine overall health status
            if health_score >= 0.9:
                health_report['overall_health'] = 'excellent'
            elif health_score >= 0.8:
                health_report['overall_health'] = 'good'
            elif health_score >= 0.7:
                health_report['overall_health'] = 'fair'
            elif health_score >= 0.5:
                health_report['overall_health'] = 'poor'
            else:
                health_report['overall_health'] = 'critical'
            
            # Generate recommendations
            health_report['recommendations'] = self._generate_recommendations(
                health_score, system_metrics, agent_scores
            )
            
            return health_report
            
        except Exception as e:
            return {
                'timestamp': datetime.now().isoformat(),
                'overall_health': 'error',
                'health_score': 0.0,
                'error': str(e)
            }
    
    def _generate_recommendations(self, health_score: float, system_metrics: Dict, agent_scores: Dict) -> List[str]:
        """Generate actionable recommendations based on evaluation"""
        recommendations = []
        
        # System-level recommendations
        if health_score < 0.7:
            recommendations.append("System health is below optimal. Consider reviewing agent assignments and workload distribution.")
        
        if system_metrics.get('failed_tasks', 0) > system_metrics.get('completed_tasks', 0) * 0.1:
            recommendations.append("High failure rate detected. Review task complexity and agent capabilities.")
        
        # Agent-specific recommendations
        low_performing_agents = [agent_id for agent_id, score in agent_scores.items() if score < 0.6]
        if low_performing_agents:
            recommendations.append(f"Consider retraining or optimizing agents: {', '.join(low_performing_agents)}")
        
        # Workload recommendations
        total_tasks = system_metrics.get('total_tasks', 0)
        if total_tasks > len(agent_scores) * 10:  # More than 10 tasks per agent
            recommendations.append("High task volume detected. Consider scaling up agent capacity.")
        
        if not recommendations:
            recommendations.append("System is performing well. Continue current operations.")
        
        return recommendations


class OptimizationEvaluator(dspy.Module):
    """Evaluates optimization effectiveness and suggests improvements"""
    
    def __init__(self):
        super().__init__()
        
    def forward(self, before_metrics: Dict[str, float], after_metrics: Dict[str, float]) -> Dict[str, Any]:
        """
        Evaluate optimization effectiveness
        
        Args:
            before_metrics: Metrics before optimization
            after_metrics: Metrics after optimization
            
        Returns:
            Optimization evaluation results
        """
        try:
            evaluation = {
                'timestamp': datetime.now().isoformat(),
                'optimization_effective': False,
                'improvements': {},
                'regressions': {},
                'overall_improvement': 0.0,
                'recommendations': []
            }
            
            # Calculate improvements and regressions
            for metric, after_value in after_metrics.items():
                before_value = before_metrics.get(metric, 0.0)
                
                if before_value > 0:
                    improvement = (after_value - before_value) / before_value
                    
                    if improvement > 0.05:  # 5% improvement threshold
                        evaluation['improvements'][metric] = {
                            'before': before_value,
                            'after': after_value,
                            'improvement': improvement
                        }
                    elif improvement < -0.05:  # 5% regression threshold
                        evaluation['regressions'][metric] = {
                            'before': before_value,
                            'after': after_value,
                            'regression': abs(improvement)
                        }
            
            # Calculate overall improvement
            key_metrics = ['success_rate', 'avg_quality_score', 'efficiency']
            improvements = []
            
            for metric in key_metrics:
                if metric in after_metrics and metric in before_metrics:
                    before_val = before_metrics[metric]
                    after_val = after_metrics[metric]
                    if before_val > 0:
                        improvement = (after_val - before_val) / before_val
                        improvements.append(improvement)
            
            if improvements:
                evaluation['overall_improvement'] = sum(improvements) / len(improvements)
                evaluation['optimization_effective'] = evaluation['overall_improvement'] > 0.02  # 2% threshold
            
            # Generate recommendations
            if evaluation['optimization_effective']:
                evaluation['recommendations'].append("Optimization was successful. Consider applying similar techniques to other areas.")
            else:
                evaluation['recommendations'].append("Optimization showed limited impact. Review optimization strategy and parameters.")
            
            if evaluation['regressions']:
                evaluation['recommendations'].append("Some metrics regressed. Investigate and address these issues.")
            
            return evaluation
            
        except Exception as e:
            return {
                'timestamp': datetime.now().isoformat(),
                'optimization_effective': False,
                'error': str(e)
            }


class MCPEvaluationSuite:
    """Complete evaluation suite for the MCP system"""
    
    def __init__(self):
        self.task_evaluator = TaskCompletionEvaluator()
        self.agent_evaluator = AgentPerformanceEvaluator()
        self.system_evaluator = SystemHealthEvaluator()
        self.optimization_evaluator = OptimizationEvaluator()
        
    def run_comprehensive_evaluation(self, system_data: Dict[str, Any]) -> Dict[str, Any]:
        """Run complete evaluation suite"""
        try:
            evaluation_report = {
                'timestamp': datetime.now().isoformat(),
                'evaluation_type': 'comprehensive',
                'system_health': {},
                'agent_performance': {},
                'task_quality': {},
                'recommendations': []
            }
            
            # System health evaluation
            if 'system_metrics' in system_data and 'agent_data' in system_data:
                system_health = self.system_evaluator(
                    system_data['system_metrics'],
                    system_data['agent_data']
                )
                evaluation_report['system_health'] = system_health
            
            # Individual agent evaluations
            if 'agent_data' in system_data:
                for agent_id, task_history in system_data['agent_data'].items():
                    agent_metrics = self.agent_evaluator(agent_id, task_history)
                    evaluation_report['agent_performance'][agent_id] = agent_metrics
            
            # Task quality evaluation
            if 'recent_tasks' in system_data:
                task_scores = []
                for task in system_data['recent_tasks']:
                    if task.get('output') and task.get('criteria'):
                        score = self.task_evaluator(
                            task['output'],
                            task['criteria'],
                            task.get('type', 'generic')
                        )
                        task_scores.append(score)
                
                if task_scores:
                    evaluation_report['task_quality'] = {
                        'avg_score': sum(task_scores) / len(task_scores),
                        'min_score': min(task_scores),
                        'max_score': max(task_scores),
                        'total_evaluated': len(task_scores)
                    }
            
            # Aggregate recommendations
            all_recommendations = []
            if 'system_health' in evaluation_report:
                all_recommendations.extend(evaluation_report['system_health'].get('recommendations', []))
            
            evaluation_report['recommendations'] = list(set(all_recommendations))  # Remove duplicates
            
            return evaluation_report
            
        except Exception as e:
            return {
                'timestamp': datetime.now().isoformat(),
                'evaluation_type': 'comprehensive',
                'error': str(e),
                'status': 'failed'
            }



