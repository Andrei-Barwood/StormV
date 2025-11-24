# src/microburst_detection/cli/main.py
"""Command-line interface for microburst detection system."""

import asyncio
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

import typer
from rich.console import Console
from rich.table import Table
from rich.progress import Progress
from rich.panel import Panel
from rich.syntax import Syntax
import aiohttp

app = typer.Typer(
    name="microburst-detect",
    help="Professional Microburst Detection CLI for Aviation Systems"
)
console = Console()


@app.command()
def server(
    host: str = typer.Option("0.0.0.0", "--host", help="Server host"),
    port: int = typer.Option(8000, "--port", help="Server port"),
    reload: bool = typer.Option(False, "--reload", help="Enable auto-reload"),
    workers: int = typer.Option(1, "--workers", help="Number of workers")
) -> None:
    """
    Start the FastAPI server.
    
    Example:
        microburst-detect server --port 8000 --reload
    """
    from microburst_detection.api.server import run_server
    
    console.print(
        Panel(
            f"[bold green]Microburst Detection API Server[/bold green]\n"
            f"Host: {host}:{port}\n"
            f"Workers: {workers}\n"
            f"Auto-reload: {reload}",
            title="Server Configuration"
        )
    )
    
    run_server(host=host, port=port, reload=reload)


@app.command()
async def analyze(
    lidar_file: Optional[Path] = typer.Option(
        None, "--lidar", help="LIDAR data JSON file"
    ),
    radar_file: Optional[Path] = typer.Option(
        None, "--radar", help="Radar data JSON file"
    ),
    anemometer_file: Optional[Path] = typer.Option(
        None, "--anemometer", help="Anemometer data JSON file"
    ),
    output: Optional[Path] = typer.Option(
        None, "--output", "-o", help="Output file (JSON)"
    )
) -> None:
    """
    Analyze sensor data files for microbursts.
    
    Example:
        microburst-detect analyze --lidar data.json --output results.json
    """
    from microburst_detection.core.detector import MicroburstDetector
    
    detector = MicroburstDetector()
    results = []
    
    try:
        with Progress() as progress:
            task = progress.add_task("[cyan]Analyzing sensor data...", total=3)
            
            # Process LIDAR data
            if lidar_file and lidar_file.exists():
                console.print(f"[blue]Processing LIDAR: {lidar_file}[/blue]")
                with open(lidar_file) as f:
                    lidar_data = json.load(f)
                detection = await detector.process_lidar(lidar_data)
                if detection:
                    results.append(detection.model_dump())
                progress.advance(task)
            
            # Process Radar data
            if radar_file and radar_file.exists():
                console.print(f"[blue]Processing Radar: {radar_file}[/blue]")
                with open(radar_file) as f:
                    radar_data = json.load(f)
                detection = await detector.process_radar(radar_data)
                if detection:
                    results.append(detection.model_dump())
                progress.advance(task)
            
            # Process Anemometer data
            if anemometer_file and anemometer_file.exists():
                console.print(f"[blue]Processing Anemometer: {anemometer_file}[/blue]")
                progress.advance(task)
        
        if not results:
            console.print("[yellow]No microbursts detected[/yellow]")
            return
        
        # Display results
        console.print("\n[bold green]Detection Results:[/bold green]\n")
        for i, result in enumerate(results, 1):
            table = Table(title=f"Detection #{i}")
            table.add_column("Parameter", style="cyan")
            table.add_column("Value", style="magenta")
            
            for key, value in result.items():
                table.add_row(key, str(value))
            
            console.print(table)
        
        # Save results if output specified
        if output:
            with open(output, "w") as f:
                json.dump(results, f, indent=2, default=str)
            console.print(f"\n[green]✓ Results saved to {output}[/green]")
    
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]", style="bold")
        raise typer.Exit(code=1)


@app.command()
async def stream(
    api_url: str = typer.Option("http://localhost:8000", "--api", help="API server URL"),
    duration: int = typer.Option(60, "--duration", help="Stream duration in seconds")
) -> None:
    """
    Stream real-time detections from WebSocket server.
    
    Example:
        microburst-detect stream --api http://localhost:8000 --duration 120
    """
    console.print(
        Panel(
            f"[bold cyan]Connecting to {api_url}[/bold cyan]\n"
            f"Duration: {duration}s",
            title="WebSocket Stream"
        )
    )
    
    ws_url = api_url.replace("http", "ws") + "/ws/stream"
    start_time = datetime.now()
    detection_count = 0
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.ws_connect(ws_url) as ws:
                console.print("[green]✓ Connected[/green]\n")
                
                while (datetime.now() - start_time).total_seconds() < duration:
                    try:
                        msg = await asyncio.wait_for(ws.receive_json(), timeout=1.0)
                        
                        if msg.get("type") == "detection":
                            detection_count += 1
                            data = msg.get("data", {})
                            
                            severity = data.get("severity", "unknown")
                            confidence = data.get("confidence", 0)
                            wind_shear = data.get("max_wind_shear", 0)
                            
                            severity_color = {
                                "severe": "red",
                                "extreme": "dark_red",
                                "moderate": "yellow",
                                "low": "green"
                            }.get(severity, "white")
                            
                            console.print(
                                f"[{severity_color}]●[/{severity_color}] "
                                f"[bold]{severity.upper()}[/bold] "
                                f"Confidence: {confidence:.2%} "
                                f"Wind Shear: {wind_shear:.1f} m/s"
                            )
                    
                    except asyncio.TimeoutError:
                        continue
                    except Exception as e:
                        console.print(f"[yellow]Warning: {e}[/yellow]")
    
    except Exception as e:
        console.print(f"[red]Connection error: {e}[/red]", style="bold")
        raise typer.Exit(code=1)
    
    finally:
        elapsed = (datetime.now() - start_time).total_seconds()
        console.print(
            f"\n[green]Session ended[/green] - "
            f"Duration: {elapsed:.1f}s, Detections: {detection_count}"
        )


@app.command()
def version() -> None:
    """Show version information."""
    from microburst_detection import __version__
    
    console.print(
        Panel(
            f"[bold green]Microburst Detection System[/bold green]\n"
            f"Version: {__version__}\n"
            f"API: 1.0.0\n"
            f"Python: 3.11+",
            title="About"
        )
    )


@app.command()
def config(
    show: bool = typer.Option(False, "--show", help="Show current configuration"),
    set_value: Optional[str] = typer.Option(None, "--set", help="Set config value (key=value)")
) -> None:
    """
    Manage configuration settings.
    
    Example:
        microburst-detect config --show
        microburst-detect config --set WIND_SHEAR_THRESHOLD=3.5
    """
    config_file = Path.home() / ".microburst-detect" / "config.json"
    
    if not config_file.parent.exists():
        config_file.parent.mkdir(parents=True, exist_ok=True)
    
    if not config_file.exists():
        default_config = {
            "WIND_SHEAR_THRESHOLD": 3.0,
            "REFLECTIVITY_THRESHOLD": 40.0,
            "CONFIDENCE_THRESHOLD": 0.75
        }
        with open(config_file, "w") as f:
            json.dump(default_config, f, indent=2)
    
    with open(config_file) as f:
        config = json.load(f)
    
    if show:
        console.print(Panel(Syntax(json.dumps(config, indent=2), "json"), title="Configuration"))
    
    if set_value:
        key, value = set_value.split("=")
        try:
            config[key] = float(value) if "." in value else int(value) if value.isdigit() else value
            with open(config_file, "w") as f:
                json.dump(config, f, indent=2)
            console.print(f"[green]✓ Set {key} = {config[key]}[/green]")
        except Exception as e:
            console.print(f"[red]Error: {e}[/red]")
            raise typer.Exit(code=1)


@app.command()
async def benchmark() -> None:
    """
    Run performance benchmark of detection algorithms.
    """
    import time
    import numpy as np
    from microburst_detection.core.algorithms import WindShearDetector
    
    console.print("[bold cyan]Running Performance Benchmark...[/bold cyan]\n")
    
    # Generate synthetic data
    altitudes = np.linspace(0, 3000, 100)
    vertical_velocities = np.sin(np.linspace(0, 4*np.pi, 100)) * 10
    
    # Benchmark wind shear detection
    iterations = 1000
    start = time.time()
    
    for _ in range(iterations):
        WindShearDetector.calculate_wind_shear(altitudes, vertical_velocities)
    
    elapsed = time.time() - start
    avg_time = (elapsed / iterations) * 1000
    
    results_table = Table(title="Benchmark Results")
    results_table.add_column("Metric", style="cyan")
    results_table.add_column("Value", style="magenta")
    
    results_table.add_row("Total Iterations", str(iterations))
    results_table.add_row("Total Time", f"{elapsed:.3f}s")
    results_table.add_row("Average Time", f"{avg_time:.3f}ms")
    results_table.add_row("Throughput", f"{1000/avg_time:.0f} ops/sec")
    
    console.print(results_table)


if __name__ == "__main__":
    app()
