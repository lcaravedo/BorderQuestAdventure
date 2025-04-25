import React, { useState } from 'react';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';

export function TestPage() {
  const [counter, setCounter] = useState(0);
  const [showMessage, setShowMessage] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-sky-500 to-sky-800 p-4">
      <h1 className="text-4xl font-bold text-white mb-8">Test Page</h1>
      
      <Card className="w-full max-w-md bg-black/70 border-gray-700 shadow-xl mb-6">
        <CardContent className="p-6">
          <div className="text-center mb-4">
            <p className="text-white text-xl">Counter: {counter}</p>
          </div>
          
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => {
                console.log('Increment clicked');
                setCounter(prev => prev + 1);
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white py-6 px-8 text-xl font-bold"
            >
              Increment
            </Button>
            
            <Button
              onClick={() => {
                console.log('Decrement clicked');
                setCounter(prev => Math.max(0, prev - 1));
              }}
              variant="destructive"
              className="py-6 px-8 text-xl font-bold"
            >
              Decrement
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Button
        onClick={() => {
          console.log('Show message clicked');
          setShowMessage(true);
          setTimeout(() => setShowMessage(false), 3000);
        }}
        variant="outline"
        className="bg-green-500 hover:bg-green-600 text-white py-6 px-8 text-xl font-bold"
      >
        Show Message
      </Button>
      
      {showMessage && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          <Card className="w-full max-w-md bg-white">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4">Test Message</h2>
              <p>This is a test popup message that will automatically close in 3 seconds.</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default TestPage;