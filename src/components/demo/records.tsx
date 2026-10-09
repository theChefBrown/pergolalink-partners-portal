import type { ReactNode } from "react";
export function Records({
  headers,
  rows,
}: {
  headers: string[];
  rows: { id: string; cells: ReactNode[] }[];
}) {
  return (
    <div className="records-wrap">
      <table className="records">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {row.cells.map((cell, i) => (
                <td key={i} data-label={headers[i]}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
