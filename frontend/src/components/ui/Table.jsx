import React from 'react'

const Table = ({ children, className = '', ...props }) => {
  return (
    <div className="overflow-x-auto">
      <table className={`table ${className}`} {...props}>
        {children}
      </table>
    </div>
  )
}

const TableHeader = ({ children, className = '', ...props }) => {
  return (
    <thead className={`table-header ${className}`} {...props}>
      {children}
    </thead>
  )
}

const TableBody = ({ children, className = '', ...props }) => {
  return (
    <tbody className={`table-body ${className}`} {...props}>
      {children}
    </tbody>
  )
}

const TableRow = ({ children, className = '', ...props }) => {
  return (
    <tr className={className} {...props}>
      {children}
    </tr>
  )
}

const TableHead = ({ children, className = '', ...props }) => {
  return (
    <th className={className} {...props}>
      {children}
    </th>
  )
}

const TableCell = ({ children, className = '', ...props }) => {
  return (
    <td className={className} {...props}>
      {children}
    </td>
  )
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell }