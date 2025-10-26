'use client'

import { ReactNode, useState } from 'react'
import { ChevronUp, ChevronDown, Search, Filter, X, HelpCircle } from 'lucide-react'

interface Column {
  key: string
  label: string
  sortable?: boolean
  filterable?: boolean
  filterType?: 'text' | 'select' | 'number'
  filterOptions?: { value: string; label: string }[]
  render?: (value: any, row: any) => ReactNode
  tooltip?: string
  showTooltipIcon?: boolean
  className?: string
}

interface SortableTableProps {
  data: any[]
  columns: Column[]
  className?: string
  searchPlaceholder?: string
  showSearch?: boolean
  defaultSortColumn?: string
  defaultSortDirection?: SortDirection
}

type SortDirection = 'asc' | 'desc' | null

export function SortableTable({ 
  data, 
  columns, 
  className = '', 
  searchPlaceholder = 'Search...',
  showSearch = true,
  defaultSortColumn,
  defaultSortDirection = 'asc'
}: SortableTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(defaultSortColumn || null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSortColumn ? defaultSortDirection : null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [showFilters, setShowFilters] = useState(false)

  const handleSort = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey)
    if (!column?.sortable) return

    if (sortColumn === columnKey) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortDirection(null)
        setSortColumn(null)
      } else {
        setSortDirection('asc')
      }
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }

  const handleFilterChange = (columnKey: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [columnKey]: value
    }))
  }

  const clearFilters = () => {
    setFilters({})
    setSearchTerm('')
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '') || searchTerm !== ''

  // Filter and search data
  let filteredData = [...data]

  // Apply search
  if (searchTerm) {
    filteredData = filteredData.filter(row => 
      columns.some(column => {
        const value = row[column.key]
        return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      })
    )
  }

  // Apply filters
  Object.entries(filters).forEach(([columnKey, filterValue]) => {
    if (filterValue !== '') {
      filteredData = filteredData.filter(row => {
        const value = row[columnKey]
        return value && value.toString().toLowerCase().includes(filterValue.toLowerCase())
      })
    }
  })

  // Sort data
  const sortedData = filteredData.sort((a, b) => {
    if (!sortColumn || !sortDirection) return 0

    const aValue = a[sortColumn]
    const bValue = b[sortColumn]

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) return null
    if (sortDirection === 'asc') return <ChevronUp className="h-5 w-5" />
    if (sortDirection === 'desc') return <ChevronDown className="h-5 w-5" />
    return null
  }

  const filterableColumns = columns.filter(col => col.filterable)

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filter Bar */}
      {showSearch && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center gap-2">
            {filterableColumns.length > 0 && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                  showFilters 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'bg-background text-foreground border-border hover:bg-muted'
                }`}
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-accent text-accent-foreground rounded-full">
                    {Object.values(filters).filter(v => v !== '').length + (searchTerm ? 1 : 0)}
                  </span>
                )}
              </button>
            )}
            
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter Dropdowns */}
      {showSearch && showFilters && filterableColumns.length > 0 && (
        <div className="grid grid-cols-1 gap-4 p-4 bg-muted rounded-lg sm:grid-cols-2 lg:grid-cols-3">
          {filterableColumns.map((column) => (
            <div key={column.key}>
              <label className="block text-sm font-medium text-foreground mb-1">
                {column.label}
              </label>
              {column.filterType === 'select' && column.filterOptions ? (
                <select
                  value={filters[column.key] || ''}
                  onChange={(e) => handleFilterChange(column.key, e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">All {column.label}</option>
                  {column.filterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={column.filterType === 'number' ? 'number' : 'text'}
                  placeholder={`Filter by ${column.label}`}
                  value={filters[column.key] || ''}
                  onChange={(e) => handleFilterChange(column.key, e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Results Count */}
      {showSearch && (
        <div className="text-sm text-muted-foreground">
          Showing {sortedData.length} of {data.length} results
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm lg:text-base table-fixed">
          <thead>
            <tr className="border-b-2 border-border">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`text-left py-3 px-2 lg:py-4 lg:px-6 text-muted-foreground font-semibold text-sm lg:text-base ${
                    column.sortable ? 'sortable-header cursor-pointer hover:text-foreground' : ''
                  } ${column.className || ''}`}
                  onClick={() => column.sortable && handleSort(column.key)}
                  title={column.tooltip || undefined}
                  data-tooltip={column.tooltip || undefined}
                >
                  <div 
                    className="flex items-center gap-2"
                    onMouseEnter={() => column.tooltip && console.log('Tooltip:', column.tooltip)}
                  >
                    {column.label}
                    {column.showTooltipIcon && column.tooltip && (
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                    {column.sortable && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, index) => (
              <tr 
                key={index} 
                className={`border-b border-border hover:bg-muted/50 transition-colors ${
                  index % 2 === 0 ? 'bg-card/30' : 'bg-card/10'
                }`}
              >
                {columns.map((column) => (
                  <td key={column.key} className={`py-3 px-2 lg:py-4 lg:px-6 text-sm lg:text-base ${column.className || ''}`}>
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {sortedData.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No results found</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-2 text-primary hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}
