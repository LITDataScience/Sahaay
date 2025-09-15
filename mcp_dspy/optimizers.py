# SPDX-Header-Start
# SPDX-License-Identifier: LicenseRef-Sahaay-Proprietary
# © 2025 Sitaram Technologies Pvt. Ltd. All rights reserved.
# SPDX-Header-End

"""
DSPy Optimization Framework for Sahaay MCP
===============================================

Advanced optimization system using DSPy optimizers to improve
agent performance, system efficiency, and task quality.
"""

import dspy
import optuna
import asyncio
import logging
from typing import Dict, List, Any, Optional, Tuple, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
from .evaluators import MCPEvaluationSuite, EvaluationResult

logger = logging.getLogger(__name__)


class OptimizationType(Enum):
    """Types of optimization available"""
    PROMPT_OPTIMIZATION = "prompt_optimization"
    PARAMETER_TUNING = "parameter_tuning"
    WORKFLOW_OPTIMIZATION = "workflow_optimization"
    AGENT_ASSIGNMENT = "agent_assignment"
    QUALITY_IMPROVEMENT = "quality_improvement"


@dataclass
class OptimizationConfig:
    """Configuration for optimization runs"""
    optimization_type: OptimizationType
    target_metric: str
    max_trials: int = 50
    timeout_seconds: int = 3600
    improvement_threshold: float = 0.05
    parameters: Dict[str, Any] = None


class MCPPromptOptimizer(dspy.Module):
    """
    Optimizes prompts and signatures for MCP agents using DSPy optimization
    """
    
    def __init__(self, agent_modules: Dict[str, dspy.Module]):
        super().__init__()
        self.agent_modules = agent_modules
        self.evaluation_suite = MCPEvaluationSuite()
        self.optimization_history = []
        
    def optimize_agent_prompts(self, agent_id: str, training_data: List[Dict], 
                              target_metric: str = "quality_score") -> Dict[str, Any]:
        """
        Optimize prompts for a specific agent using DSPy optimizers
        
        Args:
            agent_id: Agent to optimize
            training_data: Training examples with inputs and expected outputs
            target_metric: Metric to optimize for
            
        Returns:
            Optimization results and improved agent
        """
        try:
            if agent_id not in self.agent_modules:
                return {"error": f"Agent {agent_id} not found", "status": "failed"}
            
            agent_module = self.agent_modules[agent_id]
            
            # Prepare training examples
            training_examples = []
            for data in training_data:
                example = dspy.Example(
                    **data.get('inputs', {}),
                    **{f"expected_{k}": v for k, v in data.get('outputs', {}).items()}
                )
                training_examples.append(example)
            
            if not training_examples:
                return {"error": "No training examples provided", "status": "failed"}
            
            # Define evaluation metric
            def evaluate_agent(agent, examples):
                scores = []
                for example in examples:
                    try:
                        # Run agent on example
                        result = agent(**{k: v for k, v in example.items() if not k.startswith('expected_')})
                        
                        # Compare with expected output
                        score = self._calculate_similarity_score(result, example)
                        scores.append(score)
                    except Exception as e:
                        logger.warning(f"Evaluation failed for example: {str(e)}")
                        scores.append(0.0)
                
                return sum(scores) / len(scores) if scores else 0.0
            
            # Store original performance
            original_score = evaluate_agent(agent_module, training_examples)
            
            # Try different DSPy optimizers
            optimizers = [
                dspy.BootstrapFewShot(metric=lambda gold, pred, example: self._metric_function(gold, pred, target_metric)),
                dspy.BootstrapRS(metric=lambda gold, pred, example: self._metric_function(gold, pred, target_metric)),
                dspy.KNNFewShot(k=3)
            ]
            
            best_optimizer = None
            best_score = original_score
            best_agent = agent_module
            
            for optimizer_class in optimizers:
                try:
                    # Compile with optimizer
                    optimizer = optimizer_class
                    optimized_agent = optimizer.compile(agent_module, trainset=training_examples)
                    
                    # Evaluate optimized agent
                    optimized_score = evaluate_agent(optimized_agent, training_examples)
                    
                    if optimized_score > best_score:
                        best_score = optimized_score
                        best_optimizer = optimizer_class.__name__
                        best_agent = optimized_agent
                        
                    logger.info(f"Optimizer {optimizer_class.__name__}: {optimized_score:.3f}")
                    
                except Exception as e:
                    logger.warning(f"Optimizer {optimizer_class.__name__} failed: {str(e)}")
                    continue
            
            # Update agent module
            if best_score > original_score:
                self.agent_modules[agent_id] = best_agent
            
            optimization_result = {
                "agent_id": agent_id,
                "original_score": original_score,
                "optimized_score": best_score,
                "improvement": best_score - original_score,
                "best_optimizer": best_optimizer,
                "optimization_successful": best_score > original_score,
                "timestamp": datetime.now().isoformat()
            }
            
            self.optimization_history.append(optimization_result)
            
            return optimization_result
            
        except Exception as e:
            logger.error(f"Prompt optimization failed for {agent_id}: {str(e)}")
            return {"error": str(e), "status": "failed", "agent_id": agent_id}
    
    def _metric_function(self, gold, pred, target_metric: str) -> float:
        """Custom metric function for DSPy optimization"""
        try:
            if target_metric == "quality_score":
                return self._quality_metric(gold, pred)
            elif target_metric == "accuracy":
                return self._accuracy_metric(gold, pred)
            elif target_metric == "completeness":
                return self._completeness_metric(gold, pred)
            else:
                return self._default_metric(gold, pred)
        except Exception:
            return 0.0
    
    def _quality_metric(self, gold, pred) -> float:
        """Calculate quality metric between gold and predicted outputs"""
        # Implement quality scoring logic
        if hasattr(pred, 'quality_score'):
            return float(pred.quality_score) / 100.0
        return 0.5  # Default neutral score
    
    def _accuracy_metric(self, gold, pred) -> float:
        """Calculate accuracy metric"""
        # Simple string similarity for now
        gold_str = str(gold).lower()
        pred_str = str(pred).lower()
        
        # Jaccard similarity
        gold_words = set(gold_str.split())
        pred_words = set(pred_str.split())
        
        if not gold_words and not pred_words:
            return 1.0
        
        intersection = gold_words.intersection(pred_words)
        union = gold_words.union(pred_words)
        
        return len(intersection) / len(union) if union else 0.0
    
    def _completeness_metric(self, gold, pred) -> float:
        """Calculate completeness metric"""
        gold_str = str(gold).lower()
        pred_str = str(pred).lower()
        
        gold_words = set(gold_str.split())
        pred_words = set(pred_str.split())
        
        if not gold_words:
            return 1.0
        
        coverage = len(gold_words.intersection(pred_words)) / len(gold_words)
        return coverage
    
    def _default_metric(self, gold, pred) -> float:
        """Default metric function"""
        return self._accuracy_metric(gold, pred)
    
    def _calculate_similarity_score(self, result: Any, expected: Any) -> float:
        """Calculate similarity between result and expected output"""
        try:
            # Convert to strings for comparison
            result_str = str(result).lower()
            expected_str = str(expected).lower()
            
            # Simple overlap scoring
            result_words = set(result_str.split())
            expected_words = set(expected_str.split())
            
            if not expected_words:
                return 1.0 if not result_words else 0.5
            
            overlap = len(result_words.intersection(expected_words))
            return overlap / len(expected_words)
            
        except Exception:
            return 0.0


class WorkflowOptimizer:
    """Optimizes workflow execution and agent assignment patterns"""
    
    def __init__(self):
        self.optimization_history = []
        
    def optimize_agent_assignment(self, historical_data: List[Dict], 
                                 agent_capabilities: Dict[str, List[str]]) -> Dict[str, Any]:
        """
        Optimize agent assignment using historical performance data
        
        Args:
            historical_data: Historical task assignments and outcomes
            agent_capabilities: Current agent capabilities
            
        Returns:
            Optimized assignment strategy
        """
        try:
            # Analyze historical performance by agent-task type combinations
            performance_matrix = {}
            
            for record in historical_data:
                agent_id = record.get('agent_id')
                task_type = record.get('task_type')
                success = record.get('success', False)
                quality_score = record.get('quality_score', 0)
                
                if agent_id and task_type:
                    key = (agent_id, task_type)
                    if key not in performance_matrix:
                        performance_matrix[key] = {'successes': 0, 'total': 0, 'quality_sum': 0}
                    
                    performance_matrix[key]['total'] += 1
                    if success:
                        performance_matrix[key]['successes'] += 1
                    performance_matrix[key]['quality_sum'] += quality_score
            
            # Calculate performance scores
            assignment_scores = {}
            for (agent_id, task_type), stats in performance_matrix.items():
                if stats['total'] > 0:
                    success_rate = stats['successes'] / stats['total']
                    avg_quality = stats['quality_sum'] / stats['total']
                    combined_score = (success_rate * 0.6) + (avg_quality / 100 * 0.4)
                    
                    if task_type not in assignment_scores:
                        assignment_scores[task_type] = {}
                    assignment_scores[task_type][agent_id] = combined_score
            
            # Generate optimized assignment rules
            assignment_rules = {}
            for task_type, agent_scores in assignment_scores.items():
                if agent_scores:
                    # Sort agents by performance score
                    sorted_agents = sorted(agent_scores.items(), key=lambda x: x[1], reverse=True)
                    assignment_rules[task_type] = {
                        'primary_agent': sorted_agents[0][0],
                        'backup_agents': [agent for agent, _ in sorted_agents[1:3]],  # Top 3
                        'performance_scores': dict(sorted_agents)
                    }
            
            optimization_result = {
                'assignment_rules': assignment_rules,
                'performance_matrix': {f"{k[0]}_{k[1]}": v for k, v in performance_matrix.items()},
                'optimization_type': 'agent_assignment',
                'timestamp': datetime.now().isoformat(),
                'data_points': len(historical_data)
            }
            
            self.optimization_history.append(optimization_result)
            
            return optimization_result
            
        except Exception as e:
            logger.error(f"Agent assignment optimization failed: {str(e)}")
            return {"error": str(e), "status": "failed"}
    
    def optimize_workflow_sequence(self, workflow_data: List[Dict]) -> Dict[str, Any]:
        """
        Optimize workflow step sequences based on success patterns
        
        Args:
            workflow_data: Historical workflow execution data
            
        Returns:
            Optimized workflow sequences
        """
        try:
            # Analyze workflow patterns
            sequence_performance = {}
            
            for workflow in workflow_data:
                sequence = workflow.get('sequence', [])
                success = workflow.get('success', False)
                duration = workflow.get('duration', 0)
                
                sequence_key = tuple(sequence)
                if sequence_key not in sequence_performance:
                    sequence_performance[sequence_key] = {
                        'successes': 0, 'total': 0, 'total_duration': 0
                    }
                
                sequence_performance[sequence_key]['total'] += 1
                if success:
                    sequence_performance[sequence_key]['successes'] += 1
                sequence_performance[sequence_key]['total_duration'] += duration
            
            # Find optimal sequences
            optimal_sequences = {}
            for sequence, stats in sequence_performance.items():
                if stats['total'] >= 3:  # Minimum sample size
                    success_rate = stats['successes'] / stats['total']
                    avg_duration = stats['total_duration'] / stats['total']
                    
                    # Score based on success rate and speed (inverse of duration)
                    efficiency_score = success_rate * 0.7 + (1.0 / (avg_duration + 1)) * 0.3
                    
                    workflow_type = sequence[0] if sequence else 'unknown'
                    if workflow_type not in optimal_sequences or \
                       efficiency_score > optimal_sequences[workflow_type]['score']:
                        optimal_sequences[workflow_type] = {
                            'sequence': list(sequence),
                            'score': efficiency_score,
                            'success_rate': success_rate,
                            'avg_duration': avg_duration,
                            'sample_size': stats['total']
                        }
            
            return {
                'optimal_sequences': optimal_sequences,
                'optimization_type': 'workflow_sequence',
                'timestamp': datetime.now().isoformat(),
                'analyzed_workflows': len(workflow_data)
            }
            
        except Exception as e:
            logger.error(f"Workflow sequence optimization failed: {str(e)}")
            return {"error": str(e), "status": "failed"}


class HyperparameterOptimizer:
    """Optimizes system hyperparameters using Optuna"""
    
    def __init__(self):
        self.study = None
        self.optimization_history = []
        
    def optimize_system_parameters(self, objective_function: Callable, 
                                  parameter_space: Dict[str, Any],
                                  n_trials: int = 50) -> Dict[str, Any]:
        """
        Optimize system parameters using Bayesian optimization
        
        Args:
            objective_function: Function to optimize (should return float to maximize)
            parameter_space: Dictionary defining parameter search space
            n_trials: Number of optimization trials
            
        Returns:
            Optimization results with best parameters
        """
        try:
            # Create Optuna study
            study_name = f"mcp_optimization_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            self.study = optuna.create_study(
                direction='maximize',
                study_name=study_name,
                sampler=optuna.samplers.TPESampler()
            )
            
            def optuna_objective(trial):
                # Sample parameters from search space
                params = {}
                for param_name, param_config in parameter_space.items():
                    if param_config['type'] == 'float':
                        params[param_name] = trial.suggest_float(
                            param_name, 
                            param_config['low'], 
                            param_config['high']
                        )
                    elif param_config['type'] == 'int':
                        params[param_name] = trial.suggest_int(
                            param_name,
                            param_config['low'],
                            param_config['high']
                        )
                    elif param_config['type'] == 'categorical':
                        params[param_name] = trial.suggest_categorical(
                            param_name,
                            param_config['choices']
                        )
                
                # Evaluate objective function with these parameters
                try:
                    return objective_function(params)
                except Exception as e:
                    logger.warning(f"Objective function failed with params {params}: {str(e)}")
                    return 0.0
            
            # Run optimization
            self.study.optimize(optuna_objective, n_trials=n_trials, timeout=3600)
            
            # Get results
            best_params = self.study.best_params
            best_value = self.study.best_value
            
            optimization_result = {
                'best_parameters': best_params,
                'best_value': best_value,
                'n_trials': len(self.study.trials),
                'optimization_type': 'hyperparameter',
                'timestamp': datetime.now().isoformat(),
                'study_name': study_name
            }
            
            self.optimization_history.append(optimization_result)
            
            logger.info(f"Hyperparameter optimization completed. Best value: {best_value:.4f}")
            
            return optimization_result
            
        except Exception as e:
            logger.error(f"Hyperparameter optimization failed: {str(e)}")
            return {"error": str(e), "status": "failed"}
    
    def get_optimization_history(self) -> List[Dict[str, Any]]:
        """Get history of optimization runs"""
        return self.optimization_history
    
    def get_parameter_importance(self) -> Dict[str, float]:
        """Get parameter importance from the last study"""
        if self.study is None:
            return {}
        
        try:
            importance = optuna.importance.get_param_importances(self.study)
            return importance
        except Exception as e:
            logger.warning(f"Could not calculate parameter importance: {str(e)}")
            return {}


class MCPOptimizationSuite:
    """Complete optimization suite for the MCP system"""
    
    def __init__(self, agent_modules: Dict[str, dspy.Module]):
        self.prompt_optimizer = MCPPromptOptimizer(agent_modules)
        self.workflow_optimizer = WorkflowOptimizer()
        self.hyperparameter_optimizer = HyperparameterOptimizer()
        self.evaluation_suite = MCPEvaluationSuite()
        
    async def run_comprehensive_optimization(self, optimization_config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Run comprehensive optimization across all system components
        
        Args:
            optimization_config: Configuration for optimization run
            
        Returns:
            Comprehensive optimization results
        """
        try:
            optimization_results = {
                'timestamp': datetime.now().isoformat(),
                'optimization_type': 'comprehensive',
                'results': {},
                'improvements': {},
                'status': 'running'
            }
            
            # 1. Prompt Optimization
            if optimization_config.get('optimize_prompts', True):
                logger.info("Starting prompt optimization...")
                
                for agent_id in optimization_config.get('agents_to_optimize', []):
                    training_data = optimization_config.get('training_data', {}).get(agent_id, [])
                    if training_data:
                        result = self.prompt_optimizer.optimize_agent_prompts(
                            agent_id, training_data
                        )
                        optimization_results['results'][f'prompt_{agent_id}'] = result
            
            # 2. Workflow Optimization
            if optimization_config.get('optimize_workflows', True):
                logger.info("Starting workflow optimization...")
                
                historical_data = optimization_config.get('historical_data', [])
                if historical_data:
                    # Agent assignment optimization
                    assignment_result = self.workflow_optimizer.optimize_agent_assignment(
                        historical_data,
                        optimization_config.get('agent_capabilities', {})
                    )
                    optimization_results['results']['agent_assignment'] = assignment_result
                    
                    # Workflow sequence optimization
                    workflow_data = optimization_config.get('workflow_data', [])
                    if workflow_data:
                        sequence_result = self.workflow_optimizer.optimize_workflow_sequence(workflow_data)
                        optimization_results['results']['workflow_sequence'] = sequence_result
            
            # 3. Hyperparameter Optimization
            if optimization_config.get('optimize_hyperparameters', True):
                logger.info("Starting hyperparameter optimization...")
                
                objective_function = optimization_config.get('objective_function')
                parameter_space = optimization_config.get('parameter_space')
                
                if objective_function and parameter_space:
                    hp_result = self.hyperparameter_optimizer.optimize_system_parameters(
                        objective_function,
                        parameter_space,
                        optimization_config.get('n_trials', 50)
                    )
                    optimization_results['results']['hyperparameters'] = hp_result
            
            # Calculate overall improvements
            optimization_results['improvements'] = self._calculate_improvements(
                optimization_results['results']
            )
            
            optimization_results['status'] = 'completed'
            logger.info("Comprehensive optimization completed successfully")
            
            return optimization_results
            
        except Exception as e:
            logger.error(f"Comprehensive optimization failed: {str(e)}")
            return {
                'timestamp': datetime.now().isoformat(),
                'optimization_type': 'comprehensive',
                'status': 'failed',
                'error': str(e)
            }
    
    def _calculate_improvements(self, optimization_results: Dict[str, Any]) -> Dict[str, float]:
        """Calculate overall improvements from optimization results"""
        improvements = {}
        
        for optimization_type, result in optimization_results.items():
            if isinstance(result, dict):
                if 'improvement' in result:
                    improvements[optimization_type] = result['improvement']
                elif 'optimized_score' in result and 'original_score' in result:
                    improvements[optimization_type] = result['optimized_score'] - result['original_score']
                elif 'best_value' in result:
                    improvements[optimization_type] = result['best_value']
        
        # Calculate average improvement
        if improvements:
            improvements['average'] = sum(improvements.values()) / len(improvements)
        
        return improvements
    
    def get_optimization_recommendations(self, system_metrics: Dict[str, Any]) -> List[str]:
        """Generate optimization recommendations based on system metrics"""
        recommendations = []
        
        # Performance-based recommendations
        if system_metrics.get('avg_quality_score', 0) < 75:
            recommendations.append("Consider prompt optimization to improve task quality")
        
        if system_metrics.get('task_success_rate', 0) < 0.8:
            recommendations.append("Optimize agent assignment strategy to improve success rates")
        
        if system_metrics.get('avg_completion_time', 0) > 4:  # hours
            recommendations.append("Optimize workflow sequences to reduce completion time")
        
        # Workload-based recommendations
        agent_utilization = system_metrics.get('agent_utilization', {})
        if agent_utilization:
            max_util = max(agent_utilization.values())
            min_util = min(agent_utilization.values())
            
            if max_util - min_util > 0.4:  # 40% imbalance
                recommendations.append("Optimize task distribution to balance agent workloads")
        
        # System health recommendations
        health_score = system_metrics.get('health_score', 0)
        if health_score < 0.7:
            recommendations.append("Run comprehensive optimization to improve overall system health")
        
        return recommendations



