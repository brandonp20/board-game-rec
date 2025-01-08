import React from 'react'
import BoardGameRecommender from './components/BoardGameRecommender'

function App() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <BoardGameRecommender />
      </div>
    </div>
  )
}

export default App