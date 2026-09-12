'use client'

import React from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface QRCodeProps {
  url: string
  size?: number
}

export function QRCode({ url, size = 128 }: QRCodeProps) {
  return (
    <div className="bg-white p-2 rounded-sm border border-slate-200 shadow-sm inline-block">
      <QRCodeSVG 
        value={url} 
        size={size} 
        level="Q" 
        includeMargin={false} 
        className="text-slate-900"
      />
    </div>
  )
}
