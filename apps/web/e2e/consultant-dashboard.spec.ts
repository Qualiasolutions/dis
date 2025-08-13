import { test, expect } from '@playwright/test'

// Mock consultant user setup
const mockConsultantData = {
  id: 'consultant-1',
  email: 'john.doe@dealership.com',
  consultant_profile: {
    id: 'consultant-1',
    name: 'John Doe',
    active: true,
  }
}

test.describe('Consultant Dashboard E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication and data
    await page.route('**/auth/v1/user', async route => {
      await route.fulfill({
        json: mockConsultantData
      })
    })

    // Mock visits data
    await page.route('**/rest/v1/visits*', async route => {
      const visits = [
        {
          id: 'visit-1',
          consultant_id: 'consultant-1',
          customer: {
            id: 'customer-1',
            name: 'Ahmad Salem',
            phone: '0791234567',
            email: 'ahmad@example.com'
          },
          status: 'assigned',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          vehicle_interest: {
            type: 'SUV',
            budget_range: '20k-30k JD'
          },
          notes: 'Interested in automatic transmission'
        },
        {
          id: 'visit-2',
          consultant_id: 'consultant-1',
          customer: {
            id: 'customer-2',
            name: 'Sara Ahmad',
            phone: '0797654321'
          },
          status: 'in_progress',
          created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
          updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
          vehicle_interest: {
            type: 'Sedan',
            budget_range: '15k-20k JD'
          }
        }
      ]

      await route.fulfill({
        json: visits,
        headers: {
          'Content-Range': '0-1/2'
        }
      })
    })

    // Navigate to consultant dashboard
    await page.goto('/consultant')
  })

  test('loads consultant dashboard with correct data', async ({ page }) => {
    // Check page title and header
    await expect(page.locator('h2')).toContainText('Consultant Dashboard')
    await expect(page.locator('text=Welcome back, John Doe!')).toBeVisible()

    // Check metrics cards
    await expect(page.locator('text=Today\'s Visits')).toBeVisible()
    await expect(page.locator('text=Active Now')).toBeVisible()
    await expect(page.locator('text=Completed')).toBeVisible()
    await expect(page.locator('text=Avg. Time')).toBeVisible()

    // Check customer count in tab
    await expect(page.locator('text=My Customers (2)')).toBeVisible()
  })

  test('displays customer cards correctly', async ({ page }) => {
    // Check if both customers are displayed
    await expect(page.locator('text=Ahmad Salem')).toBeVisible()
    await expect(page.locator('text=Sara Ahmad')).toBeVisible()

    // Check phone numbers
    await expect(page.locator('text=0791234567')).toBeVisible()
    await expect(page.locator('text=0797654321')).toBeVisible()

    // Check status badges
    await expect(page.locator('text=ASSIGNED')).toBeVisible()
    await expect(page.locator('text=IN_PROGRESS')).toBeVisible()

    // Check vehicle interest
    await expect(page.locator('text=SUV - 20k-30k JD')).toBeVisible()
    await expect(page.locator('text=Sedan - 15k-20k JD')).toBeVisible()
  })

  test('filters customers by status', async ({ page }) => {
    // Click on status filter
    await page.locator('input[placeholder="Filter by status"]').click()
    
    // Select "In Progress"
    await page.locator('text=In Progress').click()

    // Should only show Sara Ahmad
    await expect(page.locator('text=Sara Ahmad')).toBeVisible()
    await expect(page.locator('text=Ahmad Salem')).not.toBeVisible()

    // Reset filter to "All Visits"
    await page.locator('input[value="in_progress"]').click()
    await page.locator('text=All Visits').click()

    // Both customers should be visible again
    await expect(page.locator('text=Ahmad Salem')).toBeVisible()
    await expect(page.locator('text=Sara Ahmad')).toBeVisible()
  })

  test('starts service for assigned customer', async ({ page }) => {
    // Mock the status update request
    await page.route('**/rest/v1/visits*', async route => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          json: { id: 'visit-1', status: 'in_progress' }
        })
      } else {
        await route.continue()
      }
    })

    // Click "Start" button for assigned customer
    await page.locator('button:has-text("Start")').first().click()

    // Should show success notification
    await expect(page.locator('text=Status Updated')).toBeVisible()
  })

  test('opens customer profile modal', async ({ page }) => {
    // Mock detailed customer data request
    await page.route('**/rest/v1/visits*', async route => {
      if (route.request().url().includes('select')) {
        await route.fulfill({
          json: {
            id: 'visit-1',
            consultant_id: 'consultant-1',
            customer: {
              id: 'customer-1',
              name: 'Ahmad Salem',
              phone: '0791234567',
              email: 'ahmad@example.com'
            },
            status: 'assigned',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            vehicle_interest: {
              type: 'SUV',
              budget_range: '20k-30k JD',
              purchase_timeline: 'within_month'
            },
            notes: 'Interested in automatic transmission',
            consultant_notes: 'Customer seems serious about purchase',
            consultant: {
              id: 'consultant-1',
              name: 'John Doe'
            }
          }
        })
      } else {
        await route.continue()
      }
    })

    // Click "Details" button
    await page.locator('button:has-text("Details")').first().click()

    // Check modal content
    await expect(page.locator('text=Customer Profile')).toBeVisible()
    await expect(page.locator('text=Ahmad Salem')).toBeVisible()
    await expect(page.locator('text=0791234567')).toBeVisible()
    await expect(page.locator('text=Vehicle Interest')).toBeVisible()
    await expect(page.locator('text=SUV')).toBeVisible()
    await expect(page.locator('text=20k-30k JD')).toBeVisible()
  })

  test('updates customer notes in modal', async ({ page }) => {
    // Open customer profile modal first
    await page.locator('button:has-text("Details")').first().click()
    await expect(page.locator('text=Customer Profile')).toBeVisible()

    // Mock notes update request
    await page.route('**/rest/v1/visits*', async route => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          json: { id: 'visit-1', consultant_notes: 'Updated consultation notes' }
        })
      } else {
        await route.continue()
      }
    })

    // Update consultant notes
    const notesTextarea = page.locator('textarea[placeholder*="consultation notes"]')
    await notesTextarea.fill('Customer showed high interest in Toyota RAV4')

    // Save notes
    await page.locator('button:has-text("Save Notes")').click()

    // Should show success notification
    await expect(page.locator('text=Notes updated successfully')).toBeVisible()
  })

  test('changes customer status in modal', async ({ page }) => {
    // Open customer profile modal
    await page.locator('button:has-text("Details")').first().click()
    await expect(page.locator('text=Customer Profile')).toBeVisible()

    // Mock status update
    await page.route('**/rest/v1/visits*', async route => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          json: { id: 'visit-1', status: 'completed' }
        })
      } else {
        await route.continue()
      }
    })

    // Change status to completed
    await page.locator('select').selectOption('completed')

    // Status should be updated (this would trigger the onStatusUpdate prop)
    // In a real test, we'd verify the API call was made with correct data
  })

  test('switches to performance metrics tab', async ({ page }) => {
    // Click on Performance tab
    await page.locator('button:has-text("Performance")').click()

    // Check performance metrics content
    await expect(page.locator('text=Performance Analytics')).toBeVisible()
    await expect(page.locator('text=Total Visits')).toBeVisible()
    await expect(page.locator('text=Conversion Rate')).toBeVisible()
    await expect(page.locator('text=Avg. Service Time')).toBeVisible()
    await expect(page.locator('text=Avg. Response Time')).toBeVisible()

    // Check time range selector
    await expect(page.locator('select').first()).toBeVisible()
    await expect(page.locator('text=Today')).toBeVisible()
  })

  test('changes performance metrics time range', async ({ page }) => {
    // Switch to performance tab
    await page.locator('button:has-text("Performance")').click()

    // Change time range to "Last 7 Days"
    await page.locator('select').first().selectOption('week')
    await expect(page.locator('text=Last 7 Days')).toBeVisible()

    // Change to "Last 30 Days"
    await page.locator('select').first().selectOption('month')
    await expect(page.locator('text=Last 30 Days')).toBeVisible()
  })

  test('handles menu actions for customers', async ({ page }) => {
    // Mock status update
    await page.route('**/rest/v1/visits*', async route => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          json: { id: 'visit-1', status: 'completed' }
        })
      } else {
        await route.continue()
      }
    })

    // Click menu button (three dots) for first customer
    await page.locator('button[aria-label*="menu"]').first().click()

    // Check menu options
    await expect(page.locator('text=View Details')).toBeVisible()
    await expect(page.locator('text=Start Service')).toBeVisible()
    await expect(page.locator('text=Mark Complete')).toBeVisible()
    await expect(page.locator('text=Mark Lost')).toBeVisible()

    // Click "Mark Complete"
    await page.locator('text=Mark Complete').click()

    // Should show success notification
    await expect(page.locator('text=Status Updated')).toBeVisible()
  })

  test('refreshes data when refresh button clicked', async ({ page }) => {
    let requestCount = 0
    
    // Track requests
    await page.route('**/rest/v1/visits*', async route => {
      requestCount++
      await route.continue()
    })

    // Initial load makes first request
    await page.waitForLoadState('networkidle')
    const initialCount = requestCount

    // Click refresh button
    await page.locator('button[aria-label*="refresh"]').click()

    // Should make additional request
    await page.waitForTimeout(1000)
    expect(requestCount).toBeGreaterThan(initialCount)
  })

  test('shows wait time indicators correctly', async ({ page }) => {
    // Check for wait time badges
    await expect(page.locator('text=120m')).toBeVisible() // 2 hours for Ahmad
    await expect(page.locator('text=60m')).toBeVisible()  // 1 hour for Sara

    // Wait time should be color-coded (red for >2 hours)
    const ahmadCard = page.locator('text=Ahmad Salem').locator('xpath=ancestor::div[contains(@class, "Card")]')
    const saraCard = page.locator('text=Sara Ahmad').locator('xpath=ancestor::div[contains(@class, "Card")]')

    // Cards should exist
    await expect(ahmadCard).toBeVisible()
    await expect(saraCard).toBeVisible()
  })

  test('handles error states gracefully', async ({ page }) => {
    // Mock error response
    await page.route('**/rest/v1/visits*', async route => {
      if (route.request().method() === 'PATCH') {
        await route.abort('failed')
      } else {
        await route.continue()
      }
    })

    // Try to start service
    await page.locator('button:has-text("Start")').first().click()

    // Should show error notification
    await expect(page.locator('text=Failed to update status')).toBeVisible()
  })

  test('maintains responsive design on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Dashboard should still be functional
    await expect(page.locator('text=Consultant Dashboard')).toBeVisible()
    await expect(page.locator('text=Ahmad Salem')).toBeVisible()

    // Customer cards should stack vertically on mobile
    const customerCards = page.locator('[role="gridcell"]')
    await expect(customerCards).toHaveCount(2)
  })

  test('keyboard navigation works correctly', async ({ page }) => {
    // Tab to first details button
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab') // Skip header elements
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Should be able to navigate to customer actions
    await page.keyboard.press('Enter') // Activate first detail button
    
    // Modal should open
    await expect(page.locator('text=Customer Profile')).toBeVisible()

    // Should be able to close modal with Escape
    await page.keyboard.press('Escape')
    await expect(page.locator('text=Customer Profile')).not.toBeVisible()
  })
})