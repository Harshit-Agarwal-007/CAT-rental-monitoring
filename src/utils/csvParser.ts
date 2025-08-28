export function parseCSV<T>(csvText: string): T[] {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj: any = {};
    
    headers.forEach((header, index) => {
      const value = values[index]?.trim();
      
      // Convert numeric values
      if (value && !isNaN(Number(value))) {
        obj[header] = Number(value);
      } else {
        obj[header] = value || '';
      }
    });
    
    return obj as T;
  });
}