"use client"

import { ConnectButton } from '@rainbow-me/rainbowkit'

export default function TestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">RainbowKit Test Page</h1>
        <p className="mb-4">This page tests if RainbowKit is working properly.</p>
        <ConnectButton />
      </div>
    </div>
  )
}