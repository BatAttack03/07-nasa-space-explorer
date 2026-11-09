
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');

setupDateInputs(startInput, endInput);

const button = document.querySelector('.filters button');
const gallery = document.getElementById('gallery');

const API_URL =
  'https://science.nasa.gov/wp-json/wp/v2/apod-basic';

// Random space facts
const spaceFacts = [
  "One day on Venus is longer than its year!",
  "The Sun contains about 99.8% of our solar system's mass.",
  "Jupiter is the largest planet in our solar system.",
  "Light from the Sun takes about 8 minutes to reach Earth.",
  "Neptune has some of the fastest winds in the solar system.",
  "A day on Jupiter lasts about 10 hours."
];

// Convert YYYY-MM-DD to YYMMDD for the API
function formatDate(date) {
  return date.replaceAll('-', '').slice(2);
}

// Clean text from the API
function cleanText(value) {
  const element = document.createElement('div');
  element.innerHTML = String(value || '');
  return element.textContent || '';
}

// Get image URL
function getImageUrl(item) {
  return item.hdurl ||
    item.thumbnail_url ||
    item.featured_image_url ||
    '';
}

// Get NASA webpage link for video entries
function getVideoUrl(item) {
  return item.permalink || item.url || '';
}

// Display a random fact after button click
function showRandomFact() {
  const randomFact = spaceFacts[
    Math.floor(Math.random() * spaceFacts.length)
  ];

  let fact = document.querySelector('.space-fact');

  if (!fact) {
    fact = document.createElement('p');
    fact.className = 'space-fact';
    gallery.before(fact);
  }

  fact.textContent = '🚀 Did You Know? ' + randomFact;
}

// Create a link for video entries
function createVideoLink(item, text) {
  const link = document.createElement('a');

  link.className = 'video-link';
  link.textContent = text;

  const videoUrl = getVideoUrl(item);

  if (videoUrl) {
    link.href = videoUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  } else {
    link.textContent = '🎥 Video link unavailable';
    link.removeAttribute('href');
  }

  return link;
}

// Fetch up to 9 NASA APOD entries
async function getSpaceImages() {
  const startDate = startInput.value;
  const endDate = endInput.value;

  if (!startDate || !endDate) {
    alert('Please select both dates.');
    return;
  }

  if (startDate > endDate) {
    alert('Start date must be before end date.');
    return;
  }

  // Fact appears only after clicking the button
  showRandomFact();

  // Show loading message
  gallery.textContent = '🔄 Loading space photos...';
  button.disabled = true;

  try {
    let page = 1;
    let totalPages = 1;
    const photos = [];

    do {
      const url = new URL(API_URL);

      url.searchParams.set(
        'date_from',
        formatDate(startDate)
      );

      url.searchParams.set(
        'date_to',
        formatDate(endDate)
      );

      url.searchParams.set('per_page', '25');
      url.searchParams.set('page', page);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `NASA API error: ${response.status}`
        );
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error('Unexpected NASA API response');
      }

      // Include images and videos
      const entries = data.filter(item => {
        const isImage =
          item.media_type === 'image' &&
          getImageUrl(item);

        const isVideo =
          (item.media_type === 'video' ||
            item.media_type === 'iframe') &&
          getVideoUrl(item);

        return isImage || isVideo;
      });

      photos.push(...entries);

      totalPages = Number(
        response.headers.get('X-WP-TotalPages') || 1
      );

      page++;

    } while (
      page <= totalPages &&
      photos.length < 9
    );

    // Display up to 9 cards
    displayGallery(photos.slice(0, 9));

  } catch (error) {
    console.error('NASA API Error:', error);

    gallery.textContent =
      'Unable to load NASA images: ' + error.message;

  } finally {
    button.disabled = false;

    // Remove loading message if still present
    if (
      gallery.textContent ===
      '🔄 Loading space photos...'
    ) {
      gallery.textContent = '';
    }
  }
}

// Display gallery cards
function displayGallery(data) {
  // Removes loading message
  gallery.replaceChildren();

  if (data.length === 0) {
    gallery.textContent =
      'No NASA images or videos found for this date range.';
    return;
  }

  data.forEach(item => {
    const card = document.createElement('div');

    card.className = 'gallery-item';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');

    // Image or video
    if (item.media_type === 'image') {
      const image = document.createElement('img');

      image.src = getImageUrl(item);
      image.alt = cleanText(item.title);
      image.loading = 'lazy';

      card.appendChild(image);

    } else {
      const videoLink = createVideoLink(
        item,
        '🎥 Watch NASA Space Video'
      );

      // Prevent video link from opening modal
      videoLink.addEventListener('click', event => {
        event.stopPropagation();
      });

      card.appendChild(videoLink);
    }

    // Title
    const title = document.createElement('h3');
    title.textContent = cleanText(item.title);

    // Date
    const date = document.createElement('p');
    date.textContent = item.date;

    // Only media, title, and date on main page
    card.appendChild(title);
    card.appendChild(date);

    // Open modal when card is clicked
    card.addEventListener('click', () => {
      openModal(item);
    });

    // Keyboard support
    card.addEventListener('keydown', event => {
      if (
        event.target === card &&
        (event.key === 'Enter' || event.key === ' ')
      ) {
        event.preventDefault();
        openModal(item);
      }
    });

    gallery.appendChild(card);
  });

  // Inform user if fewer than 9 entries are available
  if (data.length < 9) {
    const message = document.createElement('p');

    message.textContent =
      `Only ${data.length} NASA entries were available for these dates.`;

    gallery.appendChild(message);
  }
}

// Modal with full NASA explanation
function openModal(item) {
  const modal = document.createElement('div');
  modal.className = 'modal';

  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');

  const content = document.createElement('div');
  content.className = 'modal-content';

  // Close button
  const closeButton = document.createElement('button');
  closeButton.className = 'close-modal';
  closeButton.textContent = '×';
  closeButton.setAttribute('aria-label', 'Close');

  // Title
  const title = document.createElement('h2');
  title.textContent = cleanText(item.title);

  // Date
  const date = document.createElement('p');
  date.textContent = item.date;

  // Full explanation
  const explanation = document.createElement('p');

  explanation.textContent =
    cleanText(item.explanation) ||
    'No description available.';

  content.appendChild(closeButton);
  content.appendChild(title);
  content.appendChild(date);

  // Show larger image or video link
  if (item.media_type === 'image') {
    const image = document.createElement('img');

    image.src = getImageUrl(item);
    image.alt = cleanText(item.title);

    content.appendChild(image);

  } else {
    const videoLink = createVideoLink(
      item,
      '🎥 Watch Video on NASA'
    );

    content.appendChild(videoLink);
  }

  // Description appears only in modal
  content.appendChild(explanation);

  modal.appendChild(content);
  document.body.appendChild(modal);

  // Close modal and clean up event listener
  function closeModal() {
    modal.remove();

    document.removeEventListener(
      'keydown',
      handleEscape
    );
  }

  function handleEscape(event) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }

  // Close using X
  closeButton.addEventListener(
    'click',
    closeModal
  );

  // Close by clicking outside modal
  modal.addEventListener('click', event => {
    if (event.target === modal) {
      closeModal();
    }
  });

  // Close using Escape key
  document.addEventListener(
    'keydown',
    handleEscape
  );

  closeButton.focus();
}

// Get Space Images button
button.addEventListener('click', getSpaceImages);
