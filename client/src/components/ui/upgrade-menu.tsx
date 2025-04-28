import React, { useState } from 'react';
import { usePlayer } from '@/lib/stores/usePlayer';
import { useCollectibles } from '@/lib/stores/useCollectibles';
import { useGame } from '@/lib/stores/useGame';

const UpgradeMenu = () => {
  const { setPhase } = useGame() as any;
  const { 
    barkPower, 
    dashLevel, 
    digLevel, 
    maxStamina,
    upgradeAbility
  } = usePlayer();
  
  const { boneCount, spendBones } = useCollectibles();
  
  // Pricing tiers - cost increases with each level
  const getUpgradeCost = (currentLevel: number) => {
    return currentLevel * 5; // Level 1->2: 5 bones, Level 2->3: 10 bones
  };

  // Check if player can afford an upgrade
  const canAffordUpgrade = (currentLevel: number) => {
    return boneCount >= getUpgradeCost(currentLevel);
  };

  // Handle upgrade purchases
  const handleUpgrade = (ability: 'bark' | 'dig' | 'dash' | 'stamina') => {
    let currentLevel = 1;
    
    // Get current ability level
    switch (ability) {
      case 'bark':
        currentLevel = barkPower;
        break;
      case 'dig':
        currentLevel = digLevel;
        break;
      case 'dash':
        currentLevel = dashLevel;
        break;
      case 'stamina':
        currentLevel = Math.floor(maxStamina / 50); // Stamina levels: 100 = level 2, 150 = level 3
        break;
    }
    
    // Check if already at max level (3)
    if (currentLevel >= 3) {
      return; // Already at max level
    }
    
    // Check if player can afford upgrade
    const cost = getUpgradeCost(currentLevel);
    if (boneCount < cost) {
      return; // Can't afford
    }
    
    // Purchase upgrade
    spendBones(cost);
    
    // Apply upgrade
    if (ability === 'stamina') {
      // Stamina is a special case as it's not directly in upgradeAbility
      usePlayer.setState({ maxStamina: (currentLevel + 1) * 50 });
    } else {
      upgradeAbility(ability);
    }
  };
  
  // Format the name nicely
  const formatName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1);
  };
  
  // Return to the game
  const handleBack = () => {
    setPhase('playing');
  };
  
  // Render ability upgrade cards
  const renderUpgradeCard = (ability: 'bark' | 'dig' | 'dash' | 'stamina') => {
    let currentLevel = 1;
    let maxLevel = 3;
    let description = '';
    
    // Get current ability level and description
    switch (ability) {
      case 'bark':
        currentLevel = barkPower;
        description = 'Improves your bark attack power and range';
        break;
      case 'dig':
        currentLevel = digLevel;
        description = 'Dig faster and stay hidden longer';
        break;
      case 'dash':
        currentLevel = dashLevel;
        description = 'Increase dash speed and reduce cooldown';
        break;
      case 'stamina':
        currentLevel = Math.floor(maxStamina / 50);
        description = 'Increase maximum stamina for abilities';
        break;
    }
    
    const cost = getUpgradeCost(currentLevel);
    const canAfford = canAffordUpgrade(currentLevel);
    const isMaxLevel = currentLevel >= maxLevel;
    
    return (
      <div className="bg-gray-800 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-bold text-white">{formatName(ability)}</h3>
          <div className="flex items-center">
            <div className="flex space-x-1">
              {[...Array(maxLevel)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-3 h-3 rounded-full ${i < currentLevel ? 'bg-yellow-400' : 'bg-gray-600'}`}
                />
              ))}
            </div>
          </div>
        </div>
        
        <p className="text-gray-400 text-sm mb-3">{description}</p>
        
        <div className="flex justify-between items-center">
          <div className="text-white flex items-center">
            <img src="/textures/bone.svg" alt="Coins" className="w-5 h-5 mr-1" />
            <span>{isMaxLevel ? 'MAX' : `${cost} coins`}</span>
          </div>
          
          <button
            className={`px-3 py-1 rounded ${
              isMaxLevel 
                ? 'bg-gray-600 cursor-not-allowed text-gray-400' 
                : canAfford 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-red-600 cursor-not-allowed text-white'
            }`}
            onClick={() => !isMaxLevel && canAfford && handleUpgrade(ability)}
            disabled={isMaxLevel || !canAfford}
          >
            {isMaxLevel ? 'Maxed' : 'Upgrade'}
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Upgrade Shop</h2>
          <div className="bg-gray-800 px-3 py-1 rounded-full flex items-center">
            <img src="/textures/bone.svg" alt="Coins" className="w-5 h-5 mr-1" />
            <span className="text-white font-bold">{boneCount}</span>
          </div>
        </div>
        
        <div className="mb-6 space-y-4">
          {renderUpgradeCard('bark')}
          {renderUpgradeCard('dash')}
          {renderUpgradeCard('dig')}
          {renderUpgradeCard('stamina')}
        </div>
        
        <button
          className="w-full py-2 rounded bg-blue-600 text-white font-bold hover:bg-blue-700"
          onClick={handleBack}
        >
          Back to Game
        </button>
      </div>
    </div>
  );
};

export default UpgradeMenu;