# Desde microburst-detection/
cat > pyproject.toml << 'TOML_END'
[build-system]
requires = ["setuptools>=68.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "amarr-stormomon"
version = "1.0.0"
description = "Amarr Stormomon: Professional microburst detection system for aviation safety using LIDAR, Doppler radar, and multi-sensor fusion"
readme = "README.md"
requires-python = ">=3.11"
license = {text = "MIT"}
authors = [
    {name = "Aviation Safety Team", email = "team@microburstdetection.com"}
]
keywords = ["microburst", "wind-shear", "aviation", "weather-radar", "lidar", "safety", "amarr", "eve-online", "stormomon"]
classifiers = [
    "Development Status :: 4 - Beta",
    "Intended Audience :: Developers",
    "Intended Audience :: Science/Research",
    "License :: OSI Approved :: MIT License",
    "Natural Language :: Spanish",
    "Natural Language :: English",
    "Operating System :: OS Independent",
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
    "Programming Language :: Python :: 3.13",
    "Topic :: Scientific/Engineering :: Atmospheric Science",
    "Topic :: Scientific/Engineering :: Information Analysis",
]

dependencies = [
    "fastapi>=0.104.1",
    "uvicorn[standard]>=0.24.0",
    "pydantic>=2.5.0",
    "pydantic-settings>=2.1.0",
    "numpy>=1.24.0",
    "scipy>=1.11.0",
    "pandas>=2.1.0",
    "aiohttp>=3.9.0",
    "python-dotenv>=1.0.0",
    "structlog>=24.1.0",
    "typer>=0.9.0",
    "rich>=13.7.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",
    "pytest-asyncio>=0.21.0",
    "pytest-cov>=4.1.0",
    "black>=24.1.0",
    "ruff>=0.1.8",
    "mypy>=1.7.0",
]
ml = [
    "scikit-learn>=1.3.0",
    "torch>=2.1.0",
]
viz = [
    "matplotlib>=3.8.0",
    "plotly>=5.18.0",
]

[project.urls]
Homepage = "https://github.com/tu-usuario/amarr-stormomon"
Documentation = "https://amarr-stormomon.readthedocs.io"
Repository = "https://github.com/tu-usuario/amarr-stormomon.git"
Issues = "https://github.com/tu-usuario/amarr-stormomon/issues"

[project.scripts]
microburst-detect = "microburst_detection.cli.main:app"

[tool.setuptools.packages.find]
where = ["src"]

[tool.black]
line-length = 100
target-version = ['py311']

[tool.ruff]
line-length = 100
target-version = "py311"

[tool.pytest.ini_options]
minversion = "7.0"
testpaths = ["tests"]
python_files = ["test_*.py"]
addopts = "-v --strict-markers"
asyncio_mode = "auto"
TOML_END

echo "✅ pyproject.toml creado"
