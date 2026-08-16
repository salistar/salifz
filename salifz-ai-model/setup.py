"""
Salifz AI - Setup
"""

from setuptools import setup, find_packages
from pathlib import Path

# Read README
readme_path = Path(__file__).parent / "README.md"
long_description = readme_path.read_text(encoding="utf-8") if readme_path.exists() else ""

# Read requirements
requirements_path = Path(__file__).parent / "requirements.txt"
requirements = []
if requirements_path.exists():
    requirements = [
        line.strip() 
        for line in requirements_path.read_text().splitlines() 
        if line.strip() and not line.startswith("#")
    ]

setup(
    name="salifz-ai",
    version="1.0.0",
    author="Salifz Team",
    author_email="contact@salifz.com",
    description="AI models for Quran memorization app Salifz",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/salifz/salifz-ai-model",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "Topic :: Religion",
    ],
    python_requires=">=3.9",
    install_requires=[
        "torch>=2.0.0",
        "transformers>=4.35.0",
        "fastapi>=0.104.0",
        "uvicorn>=0.24.0",
        "pydantic>=2.5.0",
        "pyyaml>=6.0.0",
        "numpy>=1.24.0",
        "tqdm>=4.66.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.4.0",
            "pytest-cov>=4.1.0",
            "black>=23.11.0",
            "isort>=5.12.0",
            "flake8>=6.1.0",
        ],
        "audio": [
            "librosa>=0.10.0",
            "soundfile>=0.12.0",
            "torchaudio>=2.0.0",
        ],
        "arabic": [
            "camel-tools>=1.5.0",
            "pyarabic>=0.6.0",
        ],
        "full": [
            "librosa>=0.10.0",
            "soundfile>=0.12.0",
            "torchaudio>=2.0.0",
            "camel-tools>=1.5.0",
            "pyarabic>=0.6.0",
            "mlflow>=2.9.0",
            "tensorboard>=2.15.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "salifz-download=scripts.download_data:main",
            "salifz-train=scripts.train_model:main",
            "salifz-serve=api.app:main",
        ],
    },
    include_package_data=True,
    package_data={
        "": ["*.yaml", "*.json"],
    },
)
