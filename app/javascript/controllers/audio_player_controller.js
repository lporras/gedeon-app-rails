import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [
    'playIcon',
    'pauseIcon',
    'songTitle',
    'songArtist',
    'currentTime',
    'duration',
    'progressBar'
  ]

  static values = {
    songs: { type: Array, default: [] }
  }

  connect() {
    this.currentTrackIndex = -1
    this.player = null
    this.isPlaying = false
    this.songs = this.songsValue
    this.progressUpdateInterval = null

    // Initialize YouTube IFrame API
    this.loadYouTubeAPI()

    // Add keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyDown.bind(this))
  }

  disconnect() {
    // Clean up event listeners
    document.removeEventListener('keydown', this.handleKeyDown.bind(this))
    if (this.progressUpdateInterval) {
      clearInterval(this.progressUpdateInterval)
    }
  }

  handleKeyDown(event) {
    // Spacebar to play/pause
    if (event.code === 'Space' && !['INPUT', 'TEXTAREA', 'BUTTON'].includes(event.target.tagName)) {
      event.preventDefault()
      this.toggle()
    }
    // Right arrow for next
    else if (event.code === 'ArrowRight' && event.altKey) {
      event.preventDefault()
      this.next()
    }
    // Left arrow for previous song
    else if (event.code === 'ArrowLeft' && event.altKey) {
      event.preventDefault()
      this.previousSong()  // For backward compatibility - redirect to previousSong
    }
  }

  loadYouTubeAPI() {
    if (window.YT) {
      this.initializePlayer()
      return
    }

    // Load YouTube IFrame API
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    const firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)

    // This function will be called by YouTube API when ready
    window.onYouTubeIframeAPIReady = () => {
      this.initializePlayer()
    }
  }

  initializePlayer() {
    this.youTubePlayer = new YT.Player('youtube-player', {
      height: '0',
      width: '0',
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        enablejsapi: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 1,
        rel: 0
      },
      events: {
        'onReady': this.onPlayerReady.bind(this),
        'onStateChange': this.onPlayerStateChange.bind(this),
        'onError': this.onPlayerError.bind(this)
      }
    })
  }

  onPlayerReady(event) {
    console.log('YouTube player ready')
    // Start progress update loop
    this.startProgressUpdate()
  }

  onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
      this.next()
    } else if (event.data === YT.PlayerState.PLAYING) {
      this.isPlaying = true
      this.playIconTarget.classList.add('hidden')
      this.pauseIconTarget.classList.remove('hidden')
    } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.CUED) {
      this.isPlaying = false
      this.playIconTarget.classList.remove('hidden')
      this.pauseIconTarget.classList.add('hidden')
    }
  }

  onPlayerError(event) {
    console.error('YouTube Player Error:', event.data)
    // Try playing next song on error
    this.next()
  }

  startProgressUpdate() {
    if (this.progressUpdateInterval) {
      clearInterval(this.progressUpdateInterval)
    }

    this.progressUpdateInterval = setInterval(() => this.updateProgress(), 500)
  }

  playSong(index) {
    if (index < 0 || index >= this.songs.length) {
      // No more songs to play
      this.currentTrackIndex = -1
      this.songTitleTarget.textContent = 'No song selected'
      this.songArtistTarget.textContent = ''
      this.durationTarget.textContent = '0:00'
      this.currentTimeTarget.textContent = '0:00'
      this.progressBarTarget.style.width = '0%'
      return
    }

    this.currentTrackIndex = index
    const song = this.songs[index]
    const videoLink = song.video_links?.[0]

    if (!videoLink) {
      console.warn('No video link found for song:', song)
      // Try next song
      this.next()
      return
    }

    // Update UI
    this.songTitleTarget.textContent = song.title || 'Unknown Title'
    this.songArtistTarget.textContent = song.author || 'Unknown Artist'

    // Show loading state
    this.playIconTarget.classList.add('loading', 'hidden')
    this.pauseIconTarget.classList.add('hidden')

    if (this.youTubePlayer) {
      // Load and play the video
      this.youTubePlayer.loadVideoById({
        videoId: videoLink.video_id,
        suggestedQuality: 'small'
      })

      // Set a timeout to show play button if video takes too long to load
      this.loadTimeout = setTimeout(() => {
        if (!this.isPlaying) {
          this.playIconTarget.classList.remove('loading', 'hidden')
        }
      }, 2000)
    }
  }

  toggle() {
    if (this.currentTrackIndex === -1 && this.songs.length > 0) {
      // Start playing from the first song if none is selected
      this.playSong(0)
    } else if (this.youTubePlayer) {
      if (this.isPlaying) {
        this.youTubePlayer.pauseVideo()
      } else {
        this.youTubePlayer.playVideo()
      }
    }
  }

  next() {
    if (this.songs.length === 0) return

    let nextIndex = this.currentTrackIndex + 1
    if (nextIndex >= this.songs.length) {
      nextIndex = 0 // Loop back to first song
    }
    this.playSong(nextIndex)
  }

  previousSong() {
    console.log('previousSong called, current index:', this.currentTrackIndex)

    if (this.songs.length === 0) {
      console.log('No songs in playlist')
      return
    }

    let prevIndex = this.currentTrackIndex - 1

    // Find the nearest previous song that has video links
    while (prevIndex >= 0) {
      if (this.songs[prevIndex]?.video_links?.length > 0) {
        console.log('Playing previous song at index:', prevIndex, 'Title:', this.songs[prevIndex].title)
        return this.playSong(prevIndex)
      }
      prevIndex--
    }

    console.log('No previous song with video links found')
    this.showTemporaryMessage('First song in playlist')
  }

  showTemporaryMessage(message) {
    // Remove any existing status message
    const existingMessage = this.element.querySelector('.status-message')
    if (existingMessage) {
      existingMessage.remove()
    }

    // Create a new status message element
    const messageEl = document.createElement('div')
    messageEl.className = 'status-message'
    messageEl.textContent = message

    // Insert it before the player controls
    const controls = this.element.querySelector('.player-controls')
    if (controls) {
      this.element.insertBefore(messageEl, controls)

      // Remove after 2 seconds
      setTimeout(() => {
        if (messageEl.parentNode) {
          messageEl.remove()
        }
      }, 2000)
    }
  }

  restartSong() {
    if (this.currentTrackIndex >= 0 && this.youTubePlayer) {
      this.youTubePlayer.seekTo(0)
      if (!this.isPlaying) {
        this.youTubePlayer.playVideo()
      }
    }
  }

  // For backward compatibility
  previous() {
    this.previousSong()
  }

  updateProgress() {
    if (!this.youTubePlayer || !this.youTubePlayer.getCurrentTime) return

    try {
      const currentTime = this.youTubePlayer.getCurrentTime()
      const duration = this.youTubePlayer.getDuration() || 1

      // Update progress bar
      const progress = (currentTime / duration) * 100
      this.progressBarTarget.style.width = `${progress}%`

      // Update time displays
      this.currentTimeTarget.textContent = this.formatTime(currentTime)
      this.durationTarget.textContent = this.formatTime(duration)
    } catch (e) {
      console.error('Error updating progress:', e)
    }
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }
}
