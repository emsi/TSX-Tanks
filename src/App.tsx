import React, { useState, useEffect, useRef } from 'react';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const GRAVITY = 0.1;
const GROUND_HEIGHT = 50;

const generateTerrain = () => {
  const terrain = [];
  let height = CANVAS_HEIGHT - GROUND_HEIGHT;
  for (let x = 0; x < CANVAS_WIDTH; x++) {
    height += Math.random() * 4 - 2;
    height = Math.max(CANVAS_HEIGHT - GROUND_HEIGHT, Math.min(CANVAS_HEIGHT - 10, height));
    terrain.push(height);
  }
  return terrain;
};

const projectileTypes = [
  { name: 'Small', radius: 3, damage: 250 },
  { name: 'Medium', radius: 5, damage: 350 },
  { name: 'Large', radius: 8, damage: 500 },
  { name: 'Huge', radius: 12, damage: 700 },
];

const Game = () => {
  const canvasRef = useRef(null);
  const [terrain, setTerrain] = useState([]);
  const [players, setPlayers] = useState([
    { x: 0, y: 0, health: 1000, angle: 0, power: 50, projectileType: projectileTypes[0] },
    { x: 0, y: 0, health: 1000, angle: 180, power: 50, projectileType: projectileTypes[0] },
  ]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const newTerrain = generateTerrain();
    setTerrain(newTerrain);
    setPlayers([
      { ...players[0], x: Math.floor(Math.random() * (CANVAS_WIDTH / 2)), y: newTerrain[0] },
      { ...players[1], x: Math.floor(CANVAS_WIDTH / 2 + Math.random() * (CANVAS_WIDTH / 2)), y: newTerrain[CANVAS_WIDTH - 1] },
    ]);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    const drawGame = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Draw terrain
      ctx.beginPath();
      ctx.moveTo(0, CANVAS_HEIGHT);
      terrain.forEach((height, x) => {
        ctx.lineTo(x, height);
      });
      ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#8B4513';
      ctx.fill();
      
      // Draw players
      players.forEach((player, index) => {
        ctx.fillStyle = index === 0 ? 'blue' : 'red';
        ctx.fillRect(player.x - 10, player.y - 20, 20, 20);
        
        // Draw health bar
        ctx.fillStyle = 'green';
        ctx.fillRect(player.x - 25, player.y - 30, (player.health / 1000) * 50, 5);
        ctx.strokeStyle = 'black';
        ctx.strokeRect(player.x - 25, player.y - 30, 50, 5);

        // Draw angle indicator
        ctx.beginPath();
        ctx.moveTo(player.x, player.y - 20);
        const angleRad = player.angle * Math.PI / 180;
        ctx.lineTo(player.x + Math.cos(angleRad) * 20, player.y - 20 - Math.sin(angleRad) * 20);
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    };
    
    drawGame();
  }, [terrain, players]);

  const fire = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const player = players[currentPlayer];
    
    const radians = player.angle * Math.PI / 180;
    let x = player.x;
    let y = player.y - 20;
    let vx = Math.cos(radians) * player.power / 10;
    let vy = -Math.sin(radians) * player.power / 10;
    
    const animate = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Redraw game state
      terrain.forEach((height, x) => {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x, height, 1, CANVAS_HEIGHT - height);
      });
      
      players.forEach((player, index) => {
        ctx.fillStyle = index === 0 ? 'blue' : 'red';
        ctx.fillRect(player.x - 10, player.y - 20, 20, 20);
        
        // Draw health bar
        ctx.fillStyle = 'green';
        ctx.fillRect(player.x - 25, player.y - 30, (player.health / 1000) * 50, 5);
        ctx.strokeStyle = 'black';
        ctx.strokeRect(player.x - 25, player.y - 30, 50, 5);

        // Draw angle indicator
        ctx.beginPath();
        ctx.moveTo(player.x, player.y - 20);
        const angleRad = player.angle * Math.PI / 180;
        ctx.lineTo(player.x + Math.cos(angleRad) * 20, player.y - 20 - Math.sin(angleRad) * 20);
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      
      // Update projectile position
      x += vx;
      y += vy;
      vy += GRAVITY;
      
      // Draw projectile
      ctx.beginPath();
      ctx.arc(x, y, player.projectileType.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'black';
      ctx.fill();
      
      // Check for collision with terrain or players
      const terrainHeight = terrain[Math.floor(x)] || CANVAS_HEIGHT;
      const hitTerrain = y >= terrainHeight;
      const hitPlayer = players.some((p, index) => 
        index !== currentPlayer && 
        Math.abs(x - p.x) < 15 && 
        Math.abs(y - p.y) < 25
      );

      if (hitTerrain || hitPlayer || x < 0 || x > CANVAS_WIDTH) {
        // Explosion
        ctx.beginPath();
        ctx.arc(x, y, player.projectileType.radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = 'orange';
        ctx.fill();
        
        // Calculate damage
        const newPlayers = players.map((p, index) => {
          if (index !== currentPlayer) {
            const distance = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
            if (distance < player.projectileType.radius * 5) {
              const damage = Math.floor(player.projectileType.damage * (1 - distance / (player.projectileType.radius * 5)));
              const newHealth = Math.max(0, p.health - damage);
              if (newHealth === 0) {
                setGameOver(true);
              }
              return { ...p, health: newHealth };
            }
          }
          return p;
        });
        
        setPlayers(newPlayers);
        setCurrentPlayer(1 - currentPlayer);
        return;
      }
      
      requestAnimationFrame(animate);
    };
    
    animate();
  };

  const handleInputChange = (index, field, value) => {
    setPlayers(prevPlayers => {
      const newPlayers = [...prevPlayers];
      newPlayers[index] = { ...newPlayers[index], [field]: value };
      return newPlayers;
    });
  };

  if (gameOver) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Game Over!</h1>
        <p style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Player {players[0].health > 0 ? '1' : '2'} wins!</p>
        <button onClick={() => window.location.reload()} style={{ padding: '0.5rem 1rem', fontSize: '1rem', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Play Again</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Scorched Earth-like Game</h1>
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={{ border: '1px solid #ccc', marginBottom: '1rem' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '800px', marginBottom: '1rem' }}>
        {players.map((player, index) => (
          <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem', border: '1px solid #ccc', borderRadius: '4px' }}>
            <h2 style={{ marginBottom: '0.5rem' }}>Player {index + 1}</h2>
            <p>Health: {player.health}</p>
            <label>
              Angle:
              <input
                type="number"
                value={player.angle}
                onChange={(e) => handleInputChange(index, 'angle', Number(e.target.value))}
                min={index === 0 ? 0 : 90}
                max={index === 0 ? 90 : 180}
                style={{ width: '4rem', marginLeft: '0.5rem' }}
              />
            </label>
            <label>
              Power:
              <input
                type="number"
                value={player.power}
                onChange={(e) => handleInputChange(index, 'power', Number(e.target.value))}
                min={1}
                max={100}
                style={{ width: '4rem', marginLeft: '0.5rem' }}
              />
            </label>
            <label>
              Projectile:
              <select
                value={player.projectileType.name}
                onChange={(e) => handleInputChange(index, 'projectileType', projectileTypes.find(p => p.name === e.target.value))}
                style={{ marginLeft: '0.5rem' }}
              >
                {projectileTypes.map((type) => (
                  <option key={type.name} value={type.name}>
                    {type.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <button onClick={fire} style={{ padding: '0.5rem 1rem', fontSize: '1rem', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Fire!</button>
      </div>
      <p style={{ fontSize: '1.25rem', fontWeight: 'bold', marginTop: '1rem' }}>Current Player: {currentPlayer + 1}</p>
    </div>
  );
};

export default Game;
