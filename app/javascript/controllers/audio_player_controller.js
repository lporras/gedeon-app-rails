import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [
    'playIcon',
    'pauseIcon',
    'songTitle',
    'songArtist',
    'currentTime',
    'duration',
    'progressBar',
    'progressContainer',
    'seekHandle',
    'tooltip'
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
    this.isDragging = false

    // Make sure we have the songs data
    if (!this.songs || !Array.isArray(this.songs)) {
      console.error('No songs data found')
      this.songs = []
    } else {
      console.log('Audio player connected with', this.songs.length, 'songs')
    }

    // Fix for iOS Safari/Chrome dynamic viewport
    this.fixIOSViewport()

    // Initialize YouTube IFrame API
    this.loadYouTubeAPI()

    // Add keyboard shortcuts
    this.boundHandleKeyDown = this.handleKeyDown.bind(this)
    document.addEventListener('keydown', this.boundHandleKeyDown)

    // Listen for play-song events from song buttons
    this.boundHandlePlaySong = this.handlePlaySongEvent.bind(this)
    window.addEventListener('play-song', this.boundHandlePlaySong)
  }

  disconnect() {
    // Clean up event listeners
    if (this.boundHandleKeyDown) {
      document.removeEventListener('keydown', this.boundHandleKeyDown)
    }
    if (this.boundHandlePlaySong) {
      window.removeEventListener('play-song', this.boundHandlePlaySong)
    }
    if (this.progressUpdateInterval) {
      clearInterval(this.progressUpdateInterval)
    }
    if (this.boundHandleDrag) {
      document.removeEventListener('mousemove', this.boundHandleDrag)
      document.removeEventListener('touchmove', this.boundHandleDrag)
    }
    if (this.boundStopDrag) {
      document.removeEventListener('mouseup', this.boundStopDrag)
      document.removeEventListener('touchend', this.boundStopDrag)
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

  handlePlaySongEvent(event) {
    const songId = event.detail.songId
    console.log('Received play-song event for song ID:', songId)

    const songIndex = this.songs.findIndex(song => song.id === songId)

    if (songIndex === -1) {
      console.error('Song not found:', songId)
      return
    }

    console.log('Found song at index:', songIndex)

    // If the same song is already playing, just toggle play/pause
    if (this.currentTrackIndex === songIndex) {
      console.log('Same song, toggling play/pause')
      this.toggle()
      return
    }

    // Otherwise, play the selected song
    console.log('Playing new song')
    this.playSong(songIndex)
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

    // If we have a song to play, play it
    if (this.currentTrackIndex >= 0 && !this.isPlaying) {
      console.log('Auto-playing queued song at index:', this.currentTrackIndex)
      this.playSong(this.currentTrackIndex)
    }
  }

  onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
      this.next()
    } else if (event.data === YT.PlayerState.PLAYING) {
      this.isPlaying = true
      this.playIconTarget.classList.remove('loading')
      this.playIconTarget.classList.add('hidden')
      this.pauseIconTarget.classList.remove('hidden')
    } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.CUED) {
      this.isPlaying = false
      this.playIconTarget.classList.remove('loading')
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
    console.log('playSong called with index:', index)

    // Stop any currently playing song
    if (this.youTubePlayer && typeof this.youTubePlayer.stopVideo === 'function') {
      this.youTubePlayer.stopVideo()
    }

    if (index < 0 || index >= this.songs.length) {
      this.resetPlayer()
      return
    }

    this.currentTrackIndex = index
    const song = this.songs[index]
    const videoLink = song.video_links?.[0]

    if (!videoLink) {
      console.warn('No video link found for song:', song)
      this.next()
      return
    }

    // Update UI
    this.updateSongInfo(song)

    // Show loading state
    this.showLoadingState()

    if (this.youTubePlayer) {
      console.log('Loading video:', videoLink.video_id)
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

  // Helper method to update song info in UI
  updateSongInfo(song) {
    this.songTitleTarget.textContent = song.title || 'Unknown Title'
    this.songArtistTarget.textContent = song.author || 'Unknown Artist'
    this.currentTimeTarget.textContent = '0:00'
    this.progressBarTarget.style.width = '0%'
  }

  // Helper method to show loading state
  showLoadingState() {
    this.playIconTarget.classList.add('loading', 'hidden')
    this.pauseIconTarget.classList.add('hidden')
  }

  // Helper method to reset player
  resetPlayer() {
    this.currentTrackIndex = -1
    this.songTitleTarget.textContent = 'No song selected'
    this.songArtistTarget.textContent = ''
    this.durationTarget.textContent = '0:00'
    this.currentTimeTarget.textContent = '0:00'
    this.progressBarTarget.style.width = '0%'
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
    if (this.isDragging) return // Don't update while dragging

    try {
      const currentTime = this.youTubePlayer.getCurrentTime()
      const duration = this.youTubePlayer.getDuration() || 1

      // Update progress bar
      const progress = (currentTime / duration) * 100
      this.progressBarTarget.style.width = `${progress}%`
      this.seekHandleTarget.style.left = `${progress}%`

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

  seek(event) {
    if (!this.youTubePlayer || this.currentTrackIndex === -1) return
    if (event.target === this.seekHandleTarget) return // Don't seek if clicking the handle itself

    const rect = this.progressContainerTarget.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (clickX / rect.width) * 100))

    const duration = this.youTubePlayer.getDuration()
    const seekTime = (percentage / 100) * duration

    this.youTubePlayer.seekTo(seekTime, true)

    // Update UI immediately
    this.progressBarTarget.style.width = `${percentage}%`
    this.seekHandleTarget.style.left = `${percentage}%`
    this.currentTimeTarget.textContent = this.formatTime(seekTime)
  }

  startDrag(event) {
    event.preventDefault()
    this.isDragging = true

    // Bind drag handlers
    this.boundHandleDrag = this.handleDrag.bind(this)
    this.boundStopDrag = this.stopDrag.bind(this)

    document.addEventListener('mousemove', this.boundHandleDrag)
    document.addEventListener('mouseup', this.boundStopDrag)
    document.addEventListener('touchmove', this.boundHandleDrag)
    document.addEventListener('touchend', this.boundStopDrag)

    // Add visual feedback
    this.seekHandleTarget.style.transform = 'scale(1.2)'
  }

  handleDrag(event) {
    if (!this.isDragging || !this.youTubePlayer) return

    event.preventDefault()

    const clientX = event.type.includes('touch') ? event.touches[0].clientX : event.clientX
    const rect = this.progressContainerTarget.getBoundingClientRect()
    const dragX = clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (dragX / rect.width) * 100))

    // Update UI immediately for smooth dragging
    this.progressBarTarget.style.width = `${percentage}%`
    this.seekHandleTarget.style.left = `${percentage}%`

    // Update time display
    const duration = this.youTubePlayer.getDuration()
    const seekTime = (percentage / 100) * duration
    this.currentTimeTarget.textContent = this.formatTime(seekTime)
  }

  stopDrag(event) {
    if (!this.isDragging) return

    event.preventDefault()
    this.isDragging = false

    // Remove drag handlers
    document.removeEventListener('mousemove', this.boundHandleDrag)
    document.removeEventListener('mouseup', this.boundStopDrag)
    document.removeEventListener('touchmove', this.boundHandleDrag)
    document.removeEventListener('touchend', this.boundStopDrag)

    // Remove visual feedback
    this.seekHandleTarget.style.transform = ''

    // Seek to the final position
    if (this.youTubePlayer && this.currentTrackIndex !== -1) {
      const rect = this.progressContainerTarget.getBoundingClientRect()
      const handleLeft = parseFloat(this.seekHandleTarget.style.left) || 0
      const duration = this.youTubePlayer.getDuration()
      const seekTime = (handleLeft / 100) * duration

      this.youTubePlayer.seekTo(seekTime, true)
    }
  }

  showTooltip(event) {
    if (!this.youTubePlayer || this.currentTrackIndex === -1) return
    this.tooltipTarget.style.opacity = '1'
  }

  hideTooltip(event) {
    this.tooltipTarget.style.opacity = '0'
  }

  updateTooltip(event) {
    if (!this.youTubePlayer || this.currentTrackIndex === -1) return

    const rect = this.progressContainerTarget.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (mouseX / rect.width) * 100))

    const duration = this.youTubePlayer.getDuration()
    const hoverTime = (percentage / 100) * duration

    // Update tooltip position and text
    this.tooltipTarget.style.left = `${percentage}%`
    this.tooltipTarget.textContent = this.formatTime(hoverTime)
  }

  fixIOSViewport() {
    // Check if we're on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream

    if (!isIOS) return

    // Set initial viewport height
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }

    setViewportHeight()

    // Update on resize and orientation change
    window.addEventListener('resize', setViewportHeight)
    window.addEventListener('orientationchange', setViewportHeight)

    // Also listen to scroll to handle address bar hide/show
    let ticking = false
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setViewportHeight()
          ticking = false
        })
        ticking = true
      }
    })
  }
}
