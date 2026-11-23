export interface DataTableColumn<Row> {
  header: string;
  cell: (row: Row) => string;
  /** Right-align numbers so they line up. */
  numeric?: boolean;
}

interface DataTableProps<Row> {
  caption: string;
  columns: DataTableColumn<Row>[];
  rows: readonly Row[];
  rowKey: (row: Row) => string;
}

/** The exact figures behind a chart, for anyone who can't or prefers not to read it. */
export function DataTable<Row>({ caption, columns, rows, rowKey }: DataTableProps<Row>) {
  return (
    <details className="group mt-4 text-sm">
      <summary className="cursor-pointer rounded-md font-medium text-accent select-none hover:underline">
        <span className="group-open:hidden">Show data table</span>
        <span className="hidden group-open:inline">Hide data table</span>
      </summary>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              {columns.map((column) => (
                <th
                  key={column.header}
                  scope="col"
                  className={`py-2 pr-4 font-medium ${column.numeric ? 'text-right' : ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="border-b border-border last:border-0">
                {columns.map((column, index) =>
                  index === 0 ? (
                    <th key={column.header} scope="row" className="py-2 pr-4 font-normal">
                      {column.cell(row)}
                    </th>
                  ) : (
                    <td
                      key={column.header}
                      className={`py-2 pr-4 ${column.numeric ? 'text-right tabular-nums' : ''}`}
                    >
                      {column.cell(row)}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
