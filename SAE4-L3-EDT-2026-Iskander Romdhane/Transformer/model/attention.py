"""
Multi-Head Self-Attention mechanism for SchedulingTransformer.
This is the core of the negotiation - agents attend to each other's information.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import math
from typing import Tuple, Optional


class SingleHeadAttention(nn.Module):
    """
    Single head attention mechanism.
    
    Interprets attention as: "How much does each agent listen to others?"
    In negotiation terms: How much weight does each proposal get from others?
    """
    
    def __init__(self, d_model: int, d_k: int):
        """
        Args:
            d_model: Total embedding dimension
            d_k: Dimension of key/query (typically d_model / num_heads)
        """
        super().__init__()
        self.d_k = d_k
        
        # Linear projections for query, key, value
        self.W_q = nn.Linear(d_model, d_k)
        self.W_k = nn.Linear(d_model, d_k)
        self.W_v = nn.Linear(d_model, d_k)
    
    def forward(self, query: torch.Tensor, key: torch.Tensor, 
                value: torch.Tensor, mask: Optional[torch.Tensor] = None) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Compute attention.
        
        Args:
            query: (batch_size, seq_len, d_model)
            key: (batch_size, seq_len, d_model)
            value: (batch_size, seq_len, d_model)
            mask: Optional attention mask
        
        Returns:
            output: (batch_size, seq_len, d_k)
            attention_weights: (batch_size, seq_len, seq_len)
        """
        # Project to Q, K, V
        Q = self.W_q(query)  # (batch_size, seq_len, d_k)
        K = self.W_k(key)    # (batch_size, seq_len, d_k)
        V = self.W_v(value)  # (batch_size, seq_len, d_k)
        
        # Compute attention scores: Q @ K^T / sqrt(d_k)
        scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(self.d_k)
        
        # Apply mask if provided (e.g., for causal attention)
        if mask is not None:
            scores = scores.masked_fill(mask == 0, -1e9)
        
        # Softmax to get attention weights
        attention_weights = F.softmax(scores, dim=-1)  # (batch_size, seq_len, seq_len)
        
        # Apply attention to values
        output = torch.matmul(attention_weights, V)  # (batch_size, seq_len, d_k)
        
        return output, attention_weights


class MultiHeadAttention(nn.Module):
    """
    Multi-head attention mechanism.
    
    Multiple heads allow the model to consider different "negotiation aspects"
    simultaneously (e.g., room capacity, teacher preference, student preference).
    """
    
    def __init__(self, d_model: int, num_heads: int, dropout: float = 0.1):
        """
        Args:
            d_model: Total embedding dimension
            num_heads: Number of attention heads
            dropout: Dropout rate
        """
        super().__init__()
        
        assert d_model % num_heads == 0, "d_model must be divisible by num_heads"
        
        self.d_model = d_model
        self.num_heads = num_heads
        self.d_k = d_model // num_heads
        
        # Multiple attention heads
        self.heads = nn.ModuleList([
            SingleHeadAttention(d_model, self.d_k)
            for _ in range(num_heads)
        ])
        
        # Output projection to combine all heads
        self.W_o = nn.Linear(d_model, d_model)
        self.dropout = nn.Dropout(dropout)
    
    def forward(self, query: torch.Tensor, key: torch.Tensor,
                value: torch.Tensor, mask: Optional[torch.Tensor] = None) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Compute multi-head attention.
        
        Args:
            query: (batch_size, seq_len, d_model)
            key: (batch_size, seq_len, d_model)
            value: (batch_size, seq_len, d_model)
            mask: Optional attention mask
        
        Returns:
            output: (batch_size, seq_len, d_model)
            attention_weights: Average attention weights across heads
        """
        batch_size = query.size(0)
        
        # Apply all attention heads
        head_outputs = []
        head_weights = []
        
        for head in self.heads:
            output, weights = head(query, key, value, mask)
            head_outputs.append(output)
            head_weights.append(weights)
        
        # Concatenate all head outputs
        concat_output = torch.cat(head_outputs, dim=-1)  # (batch_size, seq_len, d_model)
        
        # Final linear projection
        output = self.W_o(concat_output)
        output = self.dropout(output)
        
        # Average attention weights across heads for visualization
        avg_weights = torch.stack(head_weights).mean(dim=0)  # (batch_size, seq_len, seq_len)
        
        return output, avg_weights
