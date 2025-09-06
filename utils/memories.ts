import { createClient } from './supabase/client'

export interface Memory {
  id?: string
  comment: string
  lat: number
  lng: number
  ip_address?: string
  is_flagged?: boolean
  created_at?: string
}

export interface CreateMemoryParams {
  comment: string
  lat: number
  lng: number
  ip_address: string
}

// Function to get user's IP address
export async function getUserIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    return data.ip
  } catch (error) {
    console.error('Failed to get IP address:', error)
    // Fallback IP if service fails
    return '127.0.0.1'
  }
}

// Create a new memory using Supabase RPC
export async function createMemory(params: Omit<CreateMemoryParams, 'ip_address'>): Promise<Memory | null> {
  try {
    const supabase = createClient()
    
    // Get user's IP address
    const ip_address = await getUserIP()
    
    const { data, error } = await supabase.rpc('create_memory', {
      p_comment: params.comment,
      p_lat: params.lat,
      p_lng: params.lng,
      p_ip: ip_address
    })

    if (error) {
      console.error('Error creating memory:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Failed to create memory:', error)
    return null
  }
}

// Get all memories using Supabase RPC
export async function getMemories(): Promise<Memory[]> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase.rpc('get_memories')

    if (error) {
      console.error('Error fetching memories:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Failed to fetch memories:', error)
    return []
  }
}
