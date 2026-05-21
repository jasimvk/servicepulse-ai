export async function runKvCommand<T>(command: unknown[]): Promise<T | null> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    return null;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(command),
      cache: "no-store"
    });

    if (!response.ok) {
      console.warn(`KV command failed: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = (await response.json()) as { result: unknown };
    return data.result as T;
  } catch (error) {
    console.error("KV network/parsing error:", error);
    return null;
  }
}
