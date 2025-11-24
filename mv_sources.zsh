# Entra al directorio del proyecto
cd microburst-detection

# Copia todas las fuentes a sus ubicaciones correctas
cp ~/Downloads/detector.py src/microburst_detection/core/
cp ~/Downloads/microburst_models.py src/microburst_detection/core/models.py
cp ~/Downloads/microburst_algorithms.py src/microburst_detection/core/algorithms.py
cp ~/Downloads/microburst_fastapi_server.py src/microburst_detection/api/server.py
cp ~/Downloads/schemas.py src/microburst_detection/api/
cp ~/Downloads/data_fusion.py src/microburst_detection/fusion/
cp ~/Downloads/config.py src/microburst_detection/utils/
cp ~/Downloads/microburst_cli.py src/microburst_detection/cli/main.py

