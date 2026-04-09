import axios from 'axios'
import yts from 'yt-search'

let handler = async (m, { conn, command, text, args }) => {
  if (!text) return m.reply(`❌ Please provide a name or YouTube URL.\n\n*Example:*\n.play khuda aur mohabbat\n.play https://youtube.com/watch?v=...`)

  try {
    // 1. Search on YouTube
    m.reply('🔍 Searching... Please wait.')
    const search = await yts(text)
    const video = search.all[0] // Get the first result

    if (!video) return m.reply('❌ No results found on YouTube.')

    const videoUrl = video.url
    const title = video.title
    const thumbnail = video.thumbnail
    const duration = video.timestamp
    const views = video.views

    // 2. Call Raza API for Download Links
    // Note: URL needs to be encoded for the API
    const apiUrl = `https://api.kraza.qzz.io/download/ytdl?url=${encodeURIComponent(videoUrl)}`
    const { data } = await axios.get(apiUrl)

    if (!data.status || !data.result) {
      return m.reply('❌ API Error: Could not fetch download links.')
    }

    const downloadLinks = data.result
    const caption = `🎬 *PLAY VIDEO/AUDIO*\n\n📌 *Title:* ${title}\n⌚ *Duration:* ${duration}\n👁️ *Views:* ${views.toLocaleString()}\n🔗 *Link:* ${videoUrl}\n\n_Sending file, please wait..._`

    // 3. Send Thumbnail with Info
    await conn.sendMessage(m.chat, { 
      image: { url: thumbnail }, 
      caption: caption 
    }, { quoted: m })

    // 4. Handle Commands (Audio vs Video)
    if (command.includes('mp3') || command.includes('audio')) {
      // Send Audio File
      await conn.sendMessage(m.chat, {
        audio: { url: downloadLinks.mp3 },
        mimetype: 'audio/mp4',
        fileName: `${title}.mp3`
      }, { quoted: m })
    } 
    else if (command.includes('video') || command === 'play') {
      // Send Video File
      await conn.sendMessage(m.chat, {
        video: { url: downloadLinks.mp4 },
        mimetype: 'video/mp4',
        fileName: `${title}.mp4`,
        caption: `✅ Downloaded: ${title}`
      }, { quoted: m })
    }

  } catch (e) {
    console.error(e)
    m.reply('❌ An error occurred while processing your request.')
  }
}

handler.help = ['play', 'video', 'audio'].map(v => v + ' <query/url>')
handler.tags = ['downloader']
handler.command = /^(play|video|audio|mp3|ytmp4|ytmp3)$/i
handler.register = true

export default handler
