/**
 * Pin for GitHub browser extension.
 * Privately Pin GitHub repositories to save them for later
 * 
 * @copyright   Copyright vantezzen (https://github.com/vantezzen)
 * @link        https://github.com/vantezzen/pinforgithub
 * @license     https://opensource.org/licenses/mit-license.php MIT License
 */
// Convert HTML string to element
const toElement = (source) => {
  let container = document.createElement('div');
  container.innerHTML = source;
  return container.firstElementChild;
}

// Toggle pinned status of repository
const togglePin = (repository, description, language, color, stars) => {
  // Get updated list
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(["pinned"], result => {
      if (!result.pinned) {
        result.pinned = [];
      }
      repoIsPinned = result.pinned.map(el => el.name).indexOf(repository) !== -1;

      if (repoIsPinned) {
        // Remove from list
        chrome.storage.sync.set({
          pinned: result.pinned.filter(item => item.name !== repository)
        });
      } else {
        // Add to list
        chrome.storage.sync.set({
          pinned: [
            ...result.pinned,
            {
              name: repository,
              description,
              language, 
              color,
              stars,
            }
          ]
        });
      }
      resolve(!repoIsPinned);
    });
  });
}

// Get pinned repos
chrome.storage.sync.get(["pinned"], result => {
  if (!result.pinned) {
    result.pinned = [];
  }

  const location = window.location.toString();

  // Check if currently in a repository
  if (
      /https?:\/\/github\.com(\/[^\/]*){2,}\/?/i.test(location) && 
      document.getElementsByClassName('pagehead-actions').length !== 0) {
    // Get current repository info
    const repository = /github.com\/[^\/]*\/[^\/]*/.exec(location)[0].replace(/^github.com\//, '');
    const description = document.querySelector('span[itemprop="about"]') ? document.querySelector('span[itemprop="about"]').innerHTML : '';
    const language = document.querySelector('.lang') ? document.querySelector('.lang').innerText : '';
    const color = document.querySelector('.language-color') ? document.querySelector('.language-color').style.backgroundColor : '#FFFFFF';
    const stars = document.querySelectorAll('.social-count')[2].innerText;
    let repoIsPinned = result.pinned.map(el => el.name).indexOf(repository) !== -1;

    // Add pin button to page
    const pinBtn = toElement(`
      <li id="pin-for-github-btn">
        <span class="btn btn-sm">
          <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="map-pin" class="v-align-text-bottom" role="img" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 288 512"><path fill="currentColor" d="M112 316.94v156.69l22.02 33.02c4.75 7.12 15.22 7.12 19.97 0L176 473.63V316.94c-10.39 1.92-21.06 3.06-32 3.06s-21.61-1.14-32-3.06zM144 0C64.47 0 0 64.47 0 144s64.47 144 144 144 144-64.47 144-144S223.53 0 144 0zm0 76c-37.5 0-68 30.5-68 68 0 6.62-5.38 12-12 12s-12-5.38-12-12c0-50.73 41.28-92 92-92 6.62 0 12 5.38 12 12s-5.38 12-12 12z"></path></svg>
          <span id="pin-for-github-btn-text">${ repoIsPinned ? 'Unpin' : 'Pin' }</span>
        </span>
      </li>
    `);

    // Add click listener to pin button element to pin/unpin repository
    pinBtn.addEventListener('click', () => {
        togglePin(repository, description, language, color, stars).then(status => {
          repoIsPinned = status;
          document.getElementById('pin-for-github-btn-text').innerText = repoIsPinned ? 'Unpin' : 'Pin';
        });
    });

    // Add pin button to page
    const actions = document.getElementsByClassName('pagehead-actions');
    if (actions && actions[0]) {
      actions[0].append(pinBtn);
    }

  // Test if on "Pinned repositories" site
  } else if (/https?:\/\/github\.com\/saved\/?/.test(location)) {
    // Remove 404 content
    document.querySelector('main').innerHTML = '<h1 style="text-align:center">Loading pinned repositories...</h1>';
    document.title = "Pinned repositories - GitHub";
    document.querySelector('footer div.container-lg.p-responsive').remove();

    // Get and insert list container
    const inject = chrome.runtime.getURL("pinned-list.html");
    fetch(inject)
      .then(data => data.text())
      .then(content => {
        // Inject into page
        document.querySelector('main').innerHTML = content

        // Add repositories
        result.pinned.forEach(repo => {
          const listItem = toElement(`<div class="col-12 d-block width-full py-4 border-bottom">
            <div class="d-inline-block mb-1">
              <h3>
                <a href="/${repo.name}">
                  <span class="text-normal">${repo.name.split('/')[0]} / </span>${repo.name.split('/')[1]}
                </a>
              </h3>
            </div>
          
            <div class="float-right">
          
              <div class="d-inline-block js-toggler-container js-social-container starring-container on">
                <button class="btn btn-sm js-toggler-target pin-for-github-toggle">
                  <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="map-pin" class="v-align-text-bottom" role="img" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 288 512"><path fill="currentColor" d="M112 316.94v156.69l22.02 33.02c4.75 7.12 15.22 7.12 19.97 0L176 473.63V316.94c-10.39 1.92-21.06 3.06-32 3.06s-21.61-1.14-32-3.06zM144 0C64.47 0 0 64.47 0 144s64.47 144 144 144 144-64.47 144-144S223.53 0 144 0zm0 76c-37.5 0-68 30.5-68 68 0 6.62-5.38 12-12 12s-12-5.38-12-12c0-50.73 41.28-92 92-92 6.62 0 12 5.38 12 12s-5.38 12-12 12z"></path></svg>
                  <span class="pin-for-github-toggle-text">Unpin</span>
                </button>
              </div>
          
            </div>
          
            <div class="py-1">
              <p class="d-inline-block col-9 text-gray pr-4" itemprop="description">
                ${repo.description}
                <div class="f6 text-gray mt-2">

                  <span class=" ml-0 mr-3">
                    <span class="repo-language-color" style="background-color: ${repo.color}"></span>
                    <span itemprop="programmingLanguage">${repo.language}</span>
                  </span>

                  <a class="muted-link mr-3" href="/${repo.name}/stargazers">
                    <svg aria-label="star" class="octicon octicon-star" viewBox="0 0 14 16" version="1.1" width="14" height="16" role="img"><path fill-rule="evenodd" d="M14 6l-4.9-.64L7 1 4.9 5.36 0 6l3.6 3.26L2.67 14 7 11.67 11.33 14l-.93-4.74L14 6z"></path></svg>
                    ${repo.stars}
                  </a>
                </div>
              </p>
            </div>
          </div>`);

          // Add listener for pin/unpin button
          const toggleButton = listItem.querySelector('button.pin-for-github-toggle');
          toggleButton.addEventListener('click', (e) => {
            togglePin(repo.name, repo.description, repo.language, repo.color, repo.stars).then(repoIsPinned => {
              toggleButton.querySelector('.pin-for-github-toggle-text').innerText = repoIsPinned ? 'Unpin' : 'Pin';
            });
          })

          document.getElementById('pin-for-github-list').append(listItem);
        });

        if (result.pinned.length === 0) {
          document.getElementById('pin-for-github-list').append(
            toElement(`<h3>You havn't pinned any repositories yet.</h3>`)
          );
        }
      })
      .catch(console.error);

  // Test if on github.com/pinned or github.com/pin(s)
  // Not used for pins as it is a user profile but will add a notice
  } else if (
    /https?:\/\/github\.com\/pinned\/?(\?.*)?/i.test(location) ||
    /https?:\/\/github\.com\/pins?\/?(\?.*)?/i.test(location)) {
    const userNav = document.querySelector('.user-profile-nav').parentElement;
    userNav.prepend(toElement(`
      <div class="border border-gray-dark p-4 rounded-1">
        <b>Did you want to open your pinned repositories?</b> Pins you created in "Pin for GitHub" can be seen at <a href="https://github.com/saved">https://github.com/saved</a> as this page is already used by a user.
      </div>
    `));
  }
})

// Add "Your pins" to dropdown menu
const pinnedPageBtn = toElement(`<a role="menuitem" class="dropdown-item" href="/saved">Your pins</a>`);
const appendAfter = document.querySelector('a.dropdown-item[href$="?tab=stars"]')
appendAfter.parentNode.insertBefore(pinnedPageBtn, appendAfter.nextSibling);