export default async function handler(req, res) {
  // Проверяем, что запрос — POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не поддерживается' });
  }

  // Получаем prompt из тела запроса
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Требуется описание (prompt)' });
  }

  try {
    // Запрос к API для генерации изображения
    const apiResponse = await fetch('https://api.x.ai/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.API_KEY}`, // Ключ из переменных окружения
      },
      body: JSON.stringify({
        prompt: prompt,
        model: 'grok-2-image-1212', // Укажите правильную модель, если нужно
        width: 400,
        height: 400,
        n: 1,
      }),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      throw new Error(`Ошибка API: ${apiResponse.status} - ${errorText}`);
    }

    const data = await apiResponse.json();
    const imageUrl = data.data[0].url; // Убедитесь, что структура ответа соответствует вашему API

    // Загружаем изображение
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Не удалось загрузить изображение');
    }

    const imageBuffer = await imageResponse.arrayBuffer();

    // Устанавливаем заголовки для изображения
    res.setHeader('Content-Type', imageResponse.headers.get('Content-Type'));
    res.setHeader('Content-Length', imageBuffer.byteLength);

    // Отправляем изображение клиенту
    res.send(Buffer.from(imageBuffer));
  } catch (error) {
    console.error('Ошибка:', error);
    res.status(500).json({ error: 'Не удалось сгенерировать изображение' });
  }
}