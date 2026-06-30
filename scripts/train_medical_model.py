#!/usr/bin/env python3
"""
Medical AI Assistant Training Script (Experimental)
Fine-tune Phi-3.5-mini-instruct with QLoRA on medical conversation dataset
NOT for production use — experimental R&D only
"""

import torch
import json
import os
from transformers import (
    AutoTokenizer, AutoModelForCausalLM,
    TrainingArguments, BitsAndBytesConfig
)
from peft import LoraConfig, get_peft_model, TaskType, prepare_model_for_kbit_training
from datasets import Dataset, load_dataset
from trl import SFTTrainer


class MedicalModelTrainer:
    def __init__(
        self,
        model_name="microsoft/Phi-3.5-mini-instruct",
        dataset_path="../datasets/medical_dataset_final.json",
        use_hf_dataset=False,
    ):
        self.model_name = model_name
        self.dataset_path = dataset_path
        self.use_hf_dataset = use_hf_dataset
        self.tokenizer = None
        self.model = None

    def setup_model(self):
        print(f"Loading model: {self.model_name}")

        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name, trust_remote_code=True)
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token
        self.tokenizer.padding_side = "right"

        if torch.cuda.is_available():
            quantization_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.float16,
                bnb_4bit_use_double_quant=True,
                bnb_4bit_quant_type="nf4",
            )
            print("4-bit QLoRA quantization enabled")
        else:
            quantization_config = None
            print("CPU mode (no GPU detected — use Google Colab for training)")

        model_kwargs = {
            "torch_dtype": torch.float16 if torch.cuda.is_available() else torch.float32,
            "trust_remote_code": True,
            "low_cpu_mem_usage": True,
        }
        if quantization_config:
            model_kwargs["quantization_config"] = quantization_config
            model_kwargs["device_map"] = "auto"

        self.model = AutoModelForCausalLM.from_pretrained(self.model_name, **model_kwargs)

        if quantization_config:
            self.model = prepare_model_for_kbit_training(self.model)

        lora_config = LoraConfig(
            r=16,
            lora_alpha=32,
            target_modules=["qkv_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
            lora_dropout=0.05,
            bias="none",
            task_type=TaskType.CAUSAL_LM,
        )
        self.model = get_peft_model(self.model, lora_config)
        trainable, total = self.model.get_nb_trainable_parameters()
        print(f"Trainable parameters: {trainable:,} / {total:,} ({100*trainable/total:.2f}%)")

    def load_training_data(self):
        if self.use_hf_dataset:
            print("Loading dataset from HuggingFace: ruslanmv/ai-medical-chatbot")
            raw = load_dataset("ruslanmv/ai-medical-chatbot", split="train[:4000]")
            texts = []
            for item in raw:
                question = item.get("Patient", "")
                answer = item.get("Doctor", "")
                if question and answer:
                    texts.append(self._format(question, answer))
        else:
            print(f"Loading local dataset: {self.dataset_path}")
            if not os.path.exists(self.dataset_path):
                raise FileNotFoundError(f"Dataset not found: {self.dataset_path}")
            with open(self.dataset_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            texts = []
            for item in data:
                question = item.get("input", item.get("Patient", item.get("question", "")))
                answer = item.get("output", item.get("Doctor", item.get("answer", "")))
                if question and answer:
                    texts.append(self._format(question, answer))

        print(f"Prepared {len(texts)} training samples")
        return Dataset.from_list(texts)

    def _format(self, question: str, answer: str) -> dict:
        return {
            "text": (
                "<|system|>\nYou are a helpful medical assistant. "
                "Always remind the user to consult a qualified doctor for diagnosis and treatment.<|end|>\n"
                f"<|user|>\n{question}<|end|>\n"
                f"<|assistant|>\n{answer}<|end|>"
            )
        }

    def train(self, dataset, output_dir="./phi35_medical_lora", epochs=2):
        print("Starting training...")

        training_args = TrainingArguments(
            output_dir=output_dir,
            num_train_epochs=epochs,
            per_device_train_batch_size=2,
            gradient_accumulation_steps=4,
            learning_rate=2e-4,
            warmup_steps=50,
            logging_steps=25,
            save_steps=200,
            save_total_limit=2,
            fp16=torch.cuda.is_available(),
            report_to="none",
        )

        trainer = SFTTrainer(
            model=self.model,
            train_dataset=dataset,
            args=training_args,
            tokenizer=self.tokenizer,
            dataset_text_field="text",
            max_seq_length=512,
        )

        trainer.train()
        trainer.save_model(output_dir)
        self.tokenizer.save_pretrained(output_dir)
        print(f"Model saved to {output_dir}")

    def test(self):
        questions = [
            "I have a headache and fever since 2 days. What should I do?",
            "What are the symptoms of diabetes?",
            "How can I lower my blood pressure naturally?",
        ]
        self.model.eval()
        print("\n--- Model Test ---")
        for q in questions:
            prompt = (
                "<|system|>\nYou are a helpful medical assistant.<|end|>\n"
                f"<|user|>\n{q}<|end|>\n<|assistant|>\n"
            )
            inputs = self.tokenizer(prompt, return_tensors="pt")
            if torch.cuda.is_available():
                inputs = {k: v.cuda() for k, v in inputs.items()}
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs, max_new_tokens=150, temperature=0.7, do_sample=True
                )
            response = self.tokenizer.decode(
                outputs[0][inputs["input_ids"].shape[1]:], skip_special_tokens=True
            )
            print(f"\nQ: {q}\nA: {response.strip()}")

    def run(self):
        print("Medical AI Fine-tuning (Experimental)")
        print("=" * 50)
        self.setup_model()
        dataset = self.load_training_data()
        self.train(dataset)
        self.test()
        print("\nDone. Model saved and ready for testing.")


if __name__ == "__main__":
    import sys
    use_hf = "--hf" in sys.argv
    trainer = MedicalModelTrainer(use_hf_dataset=use_hf)
    trainer.run()
