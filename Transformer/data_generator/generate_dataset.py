"""
Generate a compact reusable dataset for SchedulingTransformer training.

The goal is not a massive corpus, but a small, mixed-difficulty dataset that
is still useful for a simple web application.
"""

import sys
import os
import json
import math
import random
import argparse
from datetime import datetime, timezone
from typing import Dict, List, Tuple

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import config
from data_generator.scenario_generator import ScenarioGenerator


DEFAULT_DATASET_PATH = os.path.join("datasets", "compact_negotiation_dataset.json")
DEFAULT_DIFFICULTY_WEIGHTS = {
    "easy": 0.25,
    "medium": 0.50,
    "hard": 0.25,
}


def _scenario_counts(total_size: int, weights: Dict[str, float]) -> Dict[str, int]:
    counts = {}
    remaining = total_size
    items = list(weights.items())

    for index, (difficulty, weight) in enumerate(items):
        if index == len(items) - 1:
            counts[difficulty] = remaining
        else:
            count = int(math.floor(total_size * weight))
            counts[difficulty] = count
            remaining -= count

    return counts


def build_split(generator: ScenarioGenerator, split_name: str, split_size: int) -> List[Dict]:
    counts = _scenario_counts(split_size, DEFAULT_DIFFICULTY_WEIGHTS)
    scenarios: List[Dict] = []

    for difficulty, count in counts.items():
        for _ in range(count):
            scenario = generator.generate_scenario(difficulty=difficulty)
            scenario["dataset_split"] = split_name
            scenario["dataset_difficulty"] = difficulty
            scenarios.append(scenario)

    random.shuffle(scenarios)
    return scenarios


def build_dataset(
    train_size: int = 720,
    val_size: int = 180,
    seed: int = config.SEED
) -> Dict:
    random.seed(seed)
    generator = ScenarioGenerator(seed=seed)

    train_scenarios = build_split(generator, "train", train_size)
    val_scenarios = build_split(generator, "validation", val_size)

    return {
        "metadata": {
            "version": 1,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "seed": seed,
            "train_size": len(train_scenarios),
            "validation_size": len(val_scenarios),
            "total_slots": len(generator.all_slots),
            "difficulty_weights": DEFAULT_DIFFICULTY_WEIGHTS,
        },
        "train": train_scenarios,
        "validation": val_scenarios,
    }


def save_dataset(dataset: Dict, output_path: str = DEFAULT_DATASET_PATH) -> str:
    absolute_path = os.path.abspath(output_path)
    os.makedirs(os.path.dirname(absolute_path), exist_ok=True)
    with open(absolute_path, "w", encoding="utf-8") as dataset_file:
        json.dump(dataset, dataset_file, indent=2)
    return absolute_path


def load_dataset(dataset_path: str = DEFAULT_DATASET_PATH) -> Dict:
    with open(dataset_path, "r", encoding="utf-8") as dataset_file:
        return json.load(dataset_file)


def main():
    parser = argparse.ArgumentParser(description="Generate a compact scheduling negotiation dataset.")
    parser.add_argument("--output", default=DEFAULT_DATASET_PATH, help="Output dataset JSON path")
    parser.add_argument("--train-size", type=int, default=720, help="Number of training scenarios")
    parser.add_argument("--val-size", type=int, default=180, help="Number of validation scenarios")
    parser.add_argument("--seed", type=int, default=config.SEED, help="Random seed")
    args = parser.parse_args()

    dataset = build_dataset(train_size=args.train_size, val_size=args.val_size, seed=args.seed)
    saved_path = save_dataset(dataset, args.output)

    print("Dataset generation complete")
    print(f"Saved to: {saved_path}")
    print(f"Train scenarios: {dataset['metadata']['train_size']}")
    print(f"Validation scenarios: {dataset['metadata']['validation_size']}")
    print(f"Difficulty mix: {dataset['metadata']['difficulty_weights']}")


if __name__ == "__main__":
    main()
