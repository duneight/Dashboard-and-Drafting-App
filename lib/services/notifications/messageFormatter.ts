import { DetectedChange } from './notificationDetector'

const WHATSAPP_MESSAGE_LIMIT = 1600

export interface FormattedMessage {
  text: string
  priority: number
}

export class MessageFormatter {
  /**
   * Format a single change into a message snippet
   */
  private formatChange(change: DetectedChange): string {
    const { categoryName, categoryType, changeType, manager, currentValue, previousValue, previousManager } = change

    const emoji = categoryType === 'hall-of-fame' ? '🏆' : '💩'
    const prefix = categoryType === 'hall-of-fame' ? 'NEW RECORD!' : 'WALL OF SHAME UPDATE!'

    let message = `${emoji} ${prefix}\n\n`

    switch (changeType) {
      case 'new-leader':
        message += `${manager} just took the lead in ${categoryName}!\n`
        message += `New Record: ${currentValue}\n`
        if (previousManager && previousValue) {
          message += `Previous: ${previousValue} (${previousManager})`
        }
        break

      case 'value-change':
        message += `${manager} broke their own record in ${categoryName}!\n`
        message += `New: ${currentValue}\n`
        if (previousValue) {
          message += `Previous: ${previousValue}`
        }
        break

      case 'new-entry':
        message += `${manager} entered the top 3 in ${categoryName}!\n`
        message += `Record: ${currentValue}`
        break

      case 'rank-change':
        message += `${manager} moved up in ${categoryName}!\n`
        message += `New Rank: #${change.currentRank} (${currentValue})\n`
        if (previousManager && previousValue) {
          message += `Previous: #${change.previousRank} - ${previousManager} (${previousValue})`
        }
        break
    }

    return message
  }

  /**
   * Format multiple changes into digest messages
   */
  formatChanges(changes: DetectedChange[], maxChanges: number = 10): FormattedMessage[] {
    if (changes.length === 0) {
      return []
    }

    // Sort changes by priority: new-leader > value-change > new-entry > rank-change
    const priorityOrder: Record<DetectedChange['changeType'], number> = {
      'new-leader': 4,
      'value-change': 3,
      'new-entry': 2,
      'rank-change': 1,
    }

    const sortedChanges = [...changes].sort((a, b) => {
      const priorityDiff = priorityOrder[b.changeType] - priorityOrder[a.changeType]
      if (priorityDiff !== 0) return priorityDiff
      // If same priority, prefer rank 1 over others
      if (a.currentRank !== b.currentRank) return a.currentRank - b.currentRank
      // If same rank, prefer hall-of-fame over wall-of-shame
      if (a.categoryType !== b.categoryType) {
        return a.categoryType === 'hall-of-fame' ? -1 : 1
      }
      return 0
    })

    // Limit to max changes
    const limitedChanges = sortedChanges.slice(0, maxChanges)

    // Group by category type
    const hallOfFameChanges = limitedChanges.filter((c) => c.categoryType === 'hall-of-fame')
    const wallOfShameChanges = limitedChanges.filter((c) => c.categoryType === 'wall-of-shame')

    const messages: FormattedMessage[] = []

    // Create digest header if multiple changes
    if (limitedChanges.length > 1) {
      const header = `📊 WEEKLY RECORD UPDATE\n\n`
      const hofCount = hallOfFameChanges.length
      const wosCount = wallOfShameChanges.length

      let summary = header
      if (hofCount > 0 && wosCount > 0) {
        summary += `🏆 ${hofCount} Hall of Fame change${hofCount > 1 ? 's' : ''}\n`
        summary += `💩 ${wosCount} Wall of Shame update${wosCount > 1 ? 's' : ''}\n\n`
      } else if (hofCount > 0) {
        summary += `🏆 ${hofCount} Hall of Fame record${hofCount > 1 ? 's' : ''} updated!\n\n`
      } else if (wosCount > 0) {
        summary += `💩 ${wosCount} Wall of Shame record${wosCount > 1 ? 's' : ''} updated!\n\n`
      }

      // Add individual changes
      for (const change of limitedChanges) {
        const changeText = this.formatChange(change)
        const combined = summary + changeText

        if (combined.length <= WHATSAPP_MESSAGE_LIMIT) {
          summary = combined + '\n\n---\n\n'
        } else {
          // If adding this change would exceed limit, start a new message
          if (summary.length > header.length) {
            messages.push({
              text: summary.trim(),
              priority: 5, // High priority for digest
            })
          }
          summary = header + this.formatChange(change) + '\n\n---\n\n'
        }
      }

      if (summary.length > header.length) {
        messages.push({
          text: summary.trim(),
          priority: 5,
        })
      }
    } else if (limitedChanges.length === 1) {
      // Single change - format it nicely
      const message = this.formatChange(limitedChanges[0])
      messages.push({
        text: message,
        priority: priorityOrder[limitedChanges[0].changeType],
      })
    }

    // Split messages if they exceed limit
    const finalMessages: FormattedMessage[] = []
    for (const msg of messages) {
      if (msg.text.length <= WHATSAPP_MESSAGE_LIMIT) {
        finalMessages.push(msg)
      } else {
        // Split into multiple messages
        const parts = this.splitMessage(msg.text, msg.priority)
        finalMessages.push(...parts)
      }
    }

    return finalMessages
  }

  /**
   * Split a long message into multiple parts
   */
  private splitMessage(text: string, priority: number): FormattedMessage[] {
    const messages: FormattedMessage[] = []
    const maxLength = WHATSAPP_MESSAGE_LIMIT - 50 // Leave room for continuation marker

    let currentPart = ''
    let partNumber = 1
    const totalParts = Math.ceil(text.length / maxLength)

    const lines = text.split('\n')
    for (const line of lines) {
      const testLine = currentPart + (currentPart ? '\n' : '') + line

      if (testLine.length <= maxLength) {
        currentPart = testLine
      } else {
        if (currentPart) {
          messages.push({
            text: `${currentPart}\n\n[Part ${partNumber}/${totalParts}]`,
            priority,
          })
          partNumber++
        }
        currentPart = line
      }
    }

    if (currentPart) {
      messages.push({
        text: `${currentPart}\n\n[Part ${partNumber}/${totalParts}]`,
        priority,
      })
    }

    return messages
  }
}

