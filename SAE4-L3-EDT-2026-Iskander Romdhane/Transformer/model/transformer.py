"""
Transformer architecture for SchedulingTransformer.
This implements stacked transformer layers where each layer = one negotiation round.
"""

import torch
import torch.nn as nn
import math
from typing import Tuple, List, Dict, Optional
from model.attention import MultiHeadAttention


class PositionalEncoding(nn.Module):
    """
    Positional encoding for transformer.
    Helps the model understand that agents maintain their identity across rounds.
    
    Formula: PE(pos, 2i) = sin(pos / 10000^(2i/d_model))
             PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))
    """
    
    def __init__(self, d_model: int, max_length: int = 100):
        super().__init__()
        self.d_model = d_model
        
        # Create positional encoding matrix
        pe = torch.zeros(max_length, d_model)
        position = torch.arange(0, max_length, dtype=torch.float).unsqueeze(1)
        
        div_term = torch.exp(torch.arange(0, d_model, 2, dtype=torch.float) *
                            -(math.log(10000.0) / d_model))
        
        pe[:, 0::2] = torch.sin(position * div_term)
        if d_model % 2 == 1:
            pe[:, 1::2] = torch.cos(position * div_term)[..., :-1]
        else:
            pe[:, 1::2] = torch.cos(position * div_term)
        
        # Register as buffer (not a parameter, but part of state dict)
        self.register_buffer('pe', pe.unsqueeze(0))
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Add positional encoding to input.
        
        Args:
            x: (batch_size, seq_len, d_model)
        
        Returns:
            x + positional_encoding
        """
        return x + self.pe[:, :x.size(1), :].to(x.device)


class TransformerLayer(nn.Module):
    """
    Single Transformer layer (one negotiation round).
    
    Components:
    1. Multi-head self-attention (agents listen to each other)
    2. Feed-forward network (each agent refines their proposal)
    3. Residual connections and layer normalization
    """
    
    def __init__(self, d_model: int, num_heads: int, d_ff: int, dropout: float = 0.1):
        """
        Args:
            d_model: Model dimension
            num_heads: Number of attention heads
            d_ff: Feedforward hidden dimension
            dropout: Dropout rate
        """
        super().__init__()
        
        # Multi-head attention
        self.attention = MultiHeadAttention(d_model, num_heads, dropout)
        
        # Feedforward network (2 linear layers with ReLU)
        self.feedforward = nn.Sequential(
            nn.Linear(d_model, d_ff),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(d_ff, d_model),
            nn.Dropout(dropout)
        )
        
        # Layer normalization and residual connections
        self.norm1 = nn.LayerNorm(d_model)
        self.norm2 = nn.LayerNorm(d_model)
        
        self.dropout = nn.Dropout(dropout)
    
    def forward(self, x: torch.Tensor, mask: Optional[torch.Tensor] = None) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Forward pass of one negotiation round.
        
        Args:
            x: (batch_size, seq_len, d_model) - Agent embeddings
            mask: Optional attention mask
        
        Returns:
            output: Updated agent embeddings
            attention_weights: Attention matrix for this round
        """
        # Self-attention with residual connection
        attn_out, attn_weights = self.attention(x, x, x, mask)
        x = self.norm1(x + attn_out)
        
        # Feedforward with residual connection
        ff_out = self.feedforward(x)
        x = self.norm2(x + ff_out)
        
        return x, attn_weights


class TransformerScheduler(nn.Module):
    """
    Complete Transformer for scheduling negotiation.
    
    Architecture:
    - Input embedding layer (converts agent info to embeddings)
    - Positional encoding
    - Stacked transformer layers (N rounds of negotiation)
    - Output layer (predicts final decision)
    """
    
    def __init__(self, d_model: int, num_heads: int, num_layers: int,
                 d_ff: int, dropout: float = 0.1, num_slots: int = 40):
        """
        Args:
            d_model: Model dimension
            num_heads: Number of attention heads
            num_layers: Number of transformer layers (negotiation rounds)
            d_ff: Feedforward hidden dimension
            dropout: Dropout rate
            num_slots: Number of possible time slots
        """
        super().__init__()
        
        self.d_model = d_model
        self.num_layers = num_layers
        self.num_slots = num_slots
        
        # Input projection for embedding
        # We have 3 agents: Room Manager, Teacher, Student
        self.input_projection = nn.Linear(num_slots + 4, d_model)  # +4 for constraints
        
        # Positional encoding
        self.positional_encoding = PositionalEncoding(d_model)
        
        # Stack of transformer layers
        self.layers = nn.ModuleList([
            TransformerLayer(d_model, num_heads, d_ff, dropout)
            for _ in range(num_layers)
        ])
        
        # Output layer: predict slot probabilities
        self.output_layer = nn.Linear(d_model, num_slots)
        
        self.dropout = nn.Dropout(dropout)
    
    def embed_scenario(self, scenario: Dict[str, torch.Tensor]) -> torch.Tensor:
        """
        Convert scenario info into agent embeddings.
        
        Args:
            scenario: Dict with 'rooms', 'teacher', 'students' tensors
        
        Returns:
            Embeddings for 3 agents (batch_size, 3, d_model)
        """
        # Extract agent information
        room_info = scenario['rooms']  # (batch_size, num_slots)
        teacher_info = scenario['teacher']  # (batch_size, num_slots)
        student_info = scenario['students']  # (batch_size, num_slots)
        
        # Concatenate slot availability with constraints
        room_constraints = torch.cat([
            room_info,
            scenario['room_constraints']  # (batch_size, 4)
        ], dim=-1)
        
        teacher_constraints = torch.cat([
            teacher_info,
            scenario['teacher_constraints']
        ], dim=-1)
        
        student_constraints = torch.cat([
            student_info,
            scenario['student_constraints']
        ], dim=-1)
        
        # Project to model dimension
        room_emb = self.input_projection(room_constraints)  # (batch_size, d_model)
        teacher_emb = self.input_projection(teacher_constraints)
        student_emb = self.input_projection(student_constraints)
        
        # Stack embeddings: (batch_size, 3, d_model)
        embeddings = torch.stack([room_emb, teacher_emb, student_emb], dim=1)
        
        # Add positional encoding
        embeddings = self.positional_encoding(embeddings)
        
        return embeddings
    
    def forward(self, scenario: Dict[str, torch.Tensor],
                return_intermediate: bool = False) -> Dict:
        """
        Forward pass through all negotiation rounds.
        
        Args:
            scenario: Input negotiation scenario
            return_intermediate: If True, return outputs from each layer
        
        Returns:
            Dict with:
            - predicted_slot: (batch_size, num_slots) logits
            - attention_weights_by_layer: List of attention matrices per round
            - final_embeddings: Final agent embeddings
        """
        # Embed scenario
        embeddings = self.embed_scenario(scenario)  # (batch_size, 3, d_model)
        
        attention_weights_by_layer = []
        intermediate_embeddings = [embeddings]
        
        # Apply stacked transformer layers
        for layer in self.layers:
            embeddings, attn_weights = layer(embeddings)
            attention_weights_by_layer.append(attn_weights)
            intermediate_embeddings.append(embeddings)
        
        # Aggregate agent information (mean pooling across agents)
        aggregated = embeddings.mean(dim=1)  # (batch_size, d_model)
        
        # Predict final slot decision
        slot_logits = self.output_layer(aggregated)  # (batch_size, num_slots)
        
        result = {
            'predicted_slot': slot_logits,
            'attention_weights_by_layer': attention_weights_by_layer,
            'final_embeddings': embeddings,
            'aggregated_embedding': aggregated
        }
        
        if return_intermediate:
            result['intermediate_embeddings'] = intermediate_embeddings
        
        return result
    
    def get_negotiation_trace(self, scenario: Dict[str, torch.Tensor]) -> List[Dict]:
        """
        Get detailed trace of negotiation process across all rounds.
        
        Returns:
            List of dicts (one per layer) with:
            - round number
            - attention weights
            - slot logits at that point
        """
        embeddings = self.embed_scenario(scenario)
        trace = []
        
        for round_idx, layer in enumerate(self.layers):
            embeddings, attn_weights = layer(embeddings)
            
            # Compute slot logits at this round
            aggregated = embeddings.mean(dim=1)
            slot_logits = self.output_layer(aggregated)
            
            trace.append({
                'round': round_idx + 1,
                'attention_weights': attn_weights,
                'slot_logits': slot_logits,
                'embeddings': embeddings.detach()
            })
        
        return trace
