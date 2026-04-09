import axios from 'axios'
import yts from 'yt-search'

let handler = async (m, { conn, command, text, args }) => {
  if (!text) return m.reply(`❌ Please provide a name or YouTube URL.\n\n*Example:*\n.play khuda aur mohabbat\n.audio https://youtube.com/watch?v=...`)

  try {
    let videoUrl = ''
    let title, thumbnail, duration, views

    // 1. Check if input is a direct YouTube link
    const isUrl = text.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|(?:shorts|embed|v)\/)?([a-zA-Z0-9_-]{11})/)

    m.reply('🔍 Processing... Please wait.')

    if (isUrl) {
      videoUrl = isUrl[0]
      const videoInfo = await yts({ videoId: isUrl[1] })
      title = videoInfo.title
      thumbnail = videoInfo.thumbnail
      duration = videoInfo.timestamp
      views = videoInfo.views
    } else {
      // Search by name
      const search = await yts(text)
      const video = search.all[0]
      if (!video) return m.reply('❌ No results found on YouTube.')
      videoUrl = video.url
      title = video.title
      thumbnail = video.thumbnail
      duration = video.timestamp
      views = video.views
    }

    // 2. Call Raza API
    const apiUrl = `https://api.kraza.qzz.io/download/ytdl?url=${encodeURIComponent(videoUrl)}`
    const { data } = await axios.get(apiUrl)

    if (!data.status || !data.result) {
      return m.reply('❌ API Error: Could not fetch download links.')
    }

    const downloadLinks = data.result
    const isAudio = /audio|mp3/i.test(command)
    
    const caption = `🎬 *YOUTUBE DOWNLOADER*\n\n📌 *Title:* ${title}\n⌚ *Duration:* ${duration}\n👁️ *Views:* ${views.toLocaleString()}\n📦 *Type:* ${isAudio ? 'Audio (MP3)' : 'Video (MP4)'}\n🔗 *Link:* ${videoUrl}`

    // 3. Send Thumbnail with Details
    await conn.sendMessage(m.chat, { 
      image: { url: thumbnail }, 
      caption: caption 
    }, { quoted: m })

    // 4. Send the File
    if (isAudio) {
      // Sending Audio
      await conn.sendMessage(m.chat, {
        audio: { url: downloadLinks.mp3 },
        mimetype: 'audio/mp4',
        fileName: `${title}.mp3`
      }, { quoted: m })
    } else {
      // Sending Video
      await conn.sendMessage(m.chat, {
        video: { url: downloadLinks.mp4 },
        mimetype: 'video/mp4',
        fileName: `${title}.mp4`,
        caption: `✅ Success: ${title}`
      }, { quoted: m })
    }

  } catch (e) {
    console.error(e)
    m.reply('❌ Error: Something went wrong. Check if the API is online.')
  }
}

handler.help = ['play', 'video', 'audio', 'mp3'].map(v => v + ' <query/url>')
handler.tags = ['downloader']
handler.command = /^(play|video|audio|mp3|ytmp4|ytmp3)$/i
handler.register = true

export default handler
