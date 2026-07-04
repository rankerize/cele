import { google } from 'googleapis'
import { getOAuth2Client } from './google-auth'
import { SessionData } from './auth'

export interface GaProperty {
  name: string // example: properties/123456
  displayName: string
  propertyType: string
}

function getGaAdminClient(sessionTokens: NonNullable<SessionData['googleTokens']>) {
  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials(sessionTokens)
  return google.analyticsadmin({ version: 'v1beta', auth: oauth2Client })
}

export async function getGaProperties(
  sessionTokens: NonNullable<SessionData['googleTokens']>
): Promise<GaProperty[]> {
  const admin = getGaAdminClient(sessionTokens)
  
  // To list properties, we first need accounts. 
  // For simplicity, we'll list all accounts and then properties for each,
  // or use the properties.list with a filter if known.
  // Actually, 'properties.list' requires a filter or the account name.
  
  try {
    const accountsRes = await admin.accounts.list()
    const accounts = accountsRes.data.accounts || []
    
    let allProperties: GaProperty[] = []
    
    for (const account of accounts) {
      if (!account.name) continue
      const propsRes = await admin.properties.list({
        filter: `parent:${account.name}`
      })
      const props = (propsRes.data.properties || []).map(p => ({
        name: p.name!,
        displayName: p.displayName!,
        propertyType: p.propertyType!
      }))
      allProperties = [...allProperties, ...props]
    }
    
    return allProperties
  } catch (error) {
    console.error('Error fetching GA properties:', error)
    throw error
  }
}
