export interface IBKRFlexWebServiceConfig {
  accessToken: string;
  queryId: string;
  baseUrl?: string;
}

export interface IBKRFlexResponse {
  status: 'success' | 'error';
  message?: string;
  referenceCode?: string;
  data?: unknown;
}

export class IBKRFlexWebService {
  private config: IBKRFlexWebServiceConfig;
  private baseUrl: string;

  constructor(config: IBKRFlexWebServiceConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://ndcdyn.interactivebrokers.com/AccountManagement/FlexWebService';
  }

  /**
   * Generate a Flex Query report
   * Step 1: Send request to generate report
   * Based on official IBKR documentation
   */
  async generateReport(): Promise<IBKRFlexResponse> {
    try {
      const url = `${this.baseUrl}/SendRequest`;
      const params = new URLSearchParams({
        t: this.config.accessToken,
        q: this.config.queryId,
        v: '3' // API version 3 as required
      });

      const response = await fetch(`${url}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'PortfolioTracker/1.0', // Required by IBKR
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      
      // Parse IBKR response
      if (responseText.includes('error') || responseText.includes('Error')) {
        return {
          status: 'error',
          message: responseText
        };
      }

      // Extract reference code if successful
      const referenceMatch = responseText.match(/Reference Code: (\d+)/);
      const referenceCode = referenceMatch ? referenceMatch[1] : undefined;

      return {
        status: 'success',
        message: 'Report generation initiated successfully',
        referenceCode
      };
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Retrieve the generated Flex Query report
   * Step 2: Get the actual report data
   * Based on official IBKR documentation
   */
  async getReport(referenceCode?: string): Promise<IBKRFlexResponse> {
    try {
      const url = `${this.baseUrl}/GetStatement`;
      const params = new URLSearchParams({
        t: this.config.accessToken,
        q: this.config.queryId,
        v: '3' // API version 3 as required
      });

      if (referenceCode) {
        params.append('ref', referenceCode);
      }

      const response = await fetch(`${url}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'PortfolioTracker/1.0', // Required by IBKR
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      
      // Check if report is ready
      if (responseText.includes('Report not ready') || responseText.includes('not available')) {
        return {
          status: 'error',
          message: 'Report not ready yet. Please wait and try again.'
        };
      }

      // Check for errors
      if (responseText.includes('error') || responseText.includes('Error')) {
        return {
          status: 'error',
          message: responseText
        };
      }

      // Parse CSV data
      const csvData = this.parseCSVResponse(responseText);
      
      return {
        status: 'success',
        message: 'Report retrieved successfully',
        data: csvData
      };
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Complete workflow: Generate and retrieve report
   * Follows the official IBKR two-step process
   */
  async getCompleteReport(): Promise<IBKRFlexResponse> {
    try {
      // Step 1: Generate report
      const generateResult = await this.generateReport();
      
      if (generateResult.status === 'error') {
        return generateResult;
      }

      // Step 2: Wait for report to be ready (as per IBKR docs)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Step 3: Retrieve report
      const retrieveResult = await this.getReport(generateResult.referenceCode);
      
      return retrieveResult;
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Test connection by attempting to generate a report
   * This validates the access token and query ID
   */
  async testConnection(): Promise<IBKRFlexResponse> {
    try {
      const result = await this.generateReport();
      
      if (result.status === 'success') {
        return {
          status: 'success',
          message: 'Connection successful. Flex Query is accessible.'
        };
      }
      
      return result;
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  /**
   * Parse CSV response from IBKR
   * Handles various response formats
   */
  private parseCSVResponse(responseText: string): string[][] {
    try {
      const lines = responseText.trim().split('\n');
      const rows: string[][] = [];
      
      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const fields = line.split(',').map(field => field.trim().replace(/"/g, ''));
        if (fields.length > 0) {
          rows.push(fields);
        }
      }
      
      return rows;
    } catch (error) {
      console.error('Error parsing CSV response:', error);
      return [];
    }
  }
}
