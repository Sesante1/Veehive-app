import { View, Text } from 'react-native'
import React from 'react'
import MapView from 'react-native-maps'

const Map = () => {
  return (
    <MapView provider="google" className="w-full h-[300px]">
      <Text>Map</Text>
    </MapView>
  )
}

export default Map