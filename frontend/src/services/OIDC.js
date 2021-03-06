import ResourceError from '../models/ResourceError';

const SESSION_STORAGE_JWT = 'SESSION_STORAGE_JWT';

class OIDC {
  /**
   * @returns {string | undefined} authorization header
   */
  getAuthorizationHeader() {
    const jwt = sessionStorage.getItem(SESSION_STORAGE_JWT);
    if (jwt !== null) {
      return `Bearer ${jwt}`;
    }
  }

  async signIn({ location } = window) {  //TODO: handle LOCATION_CHANGE action
    const redirect_uri = `${location.origin}/signin/callback`;
    const { authorization_url, jwt } = await this.fetchJSON('/api/oidc/authentication-request', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ redirect_uri }),
    });
    sessionStorage.setItem(SESSION_STORAGE_JWT, jwt);
    location.replace(authorization_url);
  }

  async createSession({ location } = window) {  //TODO: handle LOCATION_CHANGE action
    const { jwt } = await this.fetchJSON(`/api/oidc/sessions${location.search}`, {
      method: 'POST',
      headers: { authorization: this.getAuthorizationHeader() },
    });
    sessionStorage.setItem(SESSION_STORAGE_JWT, jwt);
    location.replace('/');
  }

  async refreshSession() {
    const { jwt } = await this.fetchJSON(`/api/oidc/sessions/refresh`, {
      method: 'POST',
      headers: { authorization: this.getAuthorizationHeader() },
    });
    sessionStorage.setItem(SESSION_STORAGE_JWT, jwt);
  }

  /**
   * Fetch JSON.
   * @param {string} uri 
   * @param {RequestInit} options 
   * @returns {Promise<any>} 
   */
  async fetchJSON(uri, options) {
    let response;
    let value;
    try {
      response = await fetch(uri, options);
      value = await response.json();
    } catch (e) {
      throw new ResourceError({ code: e.name, message: `${e}` });
    }
    if (response.ok) {
      return value;
    } else {
      const status = response.status;
      throw new ResourceError({ code: value.error, message: value.error_message, status });
    }
  }
}

export default new OIDC()
