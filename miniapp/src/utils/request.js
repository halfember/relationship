// 真机调试时应在 miniapp/.env.local 中配置电脑的局域网地址。
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000/api')
  .replace(/\/$/, '');

/** 最大重试次数 */
const MAX_RETRIES = 2;

function networkErrorMessage(error) {
  const message = String(error?.errMsg || error?.message || '');
  if (message.includes('url not in domain list')) return '服务域名未配置，请联系管理员';
  if (message.includes('timeout')) return '请求超时，请稍后重试';
  if (message.includes('fail')) return '网络连接失败，请检查网络';
  return '网络异常，请稍后重试';
}

function isRetryableNetworkError(error) {
  return !String(error?.errMsg || error?.message || '').includes('url not in domain list');
}

function canRetry(options) {
  return String(options.method || 'GET').toUpperCase() === 'GET';
}

function requestData(options) {
  const data = options.data || {};
  if (!canRetry(options)) return data;
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined && value !== null));
}

/**
 * 统一请求封装（带重试机制）
 */
function request(options, retryCount = 0) {
  return new Promise((resolve, reject) => {
    const userInfo = uni.getStorageSync('userInfo');
    const token = userInfo?.accessToken || '';

    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: requestData(options),
      timeout: 15000,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'X-Client': 'miniapp/v1.4.3',
      },
      success: (res) => {
        const { statusCode, data } = res;

        if (statusCode === 200) {
          if (data.code === 0) {
            resolve(data.data);
          } else {
            if (!options.silent) uni.showToast({ title: data.message || '请求失败', icon: 'none' });
            reject(data);
          }
        } else if (statusCode === 401) {
          if (!options.silent) {
            uni.removeStorageSync('userInfo');
            uni.showToast({ title: '登录已过期，请重新登录', icon: 'none' });
            setTimeout(() => uni.reLaunch({ url: '/pages/login/login' }), 500);
          }
          reject(data);
        } else if (statusCode >= 500 && retryCount < MAX_RETRIES && canRetry(options)) {
          // 服务端错误自动重试
          setTimeout(() => {
            request(options, retryCount + 1).then(resolve).catch(reject);
          }, 1000 * (retryCount + 1));
        } else {
          if (!options.silent) uni.showToast({ title: data?.message || `请求失败 (${statusCode})`, icon: 'none' });
          reject(data);
        }
      },
      fail: (err) => {
        console.error('API request failed', BASE_URL + options.url, err);
        if (retryCount < MAX_RETRIES && canRetry(options) && isRetryableNetworkError(err)) {
          setTimeout(() => {
            request(options, retryCount + 1).then(resolve).catch(reject);
          }, 1000 * (retryCount + 1));
        } else {
          if (!options.silent) uni.showToast({ title: networkErrorMessage(err), icon: 'none' });
          reject(err);
        }
      },
    });
  });
}

export function get(url, data) {
  return request({ url, method: 'GET', data });
}

export function post(url, data) {
  return request({ url, method: 'POST', data });
}

export function postSilent(url, data) {
  return request({ url, method: 'POST', data, silent: true });
}

export function put(url, data) {
  return request({ url, method: 'PUT', data });
}

export function del(url, data) {
  return request({ url, method: 'DELETE', data });
}

/**
 * 文件上传
 * @param {string} url    接口路径
 * @param {string} filePath 本地文件路径
 * @param {string} name   上传字段名（默认 file）
 * @param {object} formData 附加表单参数
 */
export function upload(url, filePath, name = 'file', formData = {}) {
  return new Promise((resolve, reject) => {
    const userInfo = uni.getStorageSync('userInfo');
    const token = userInfo?.accessToken || '';

    uni.uploadFile({
      url: BASE_URL + url,
      filePath,
      name,
      formData,
      timeout: 30000,
      header: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'X-Client': 'miniapp/v1.4.3',
      },
      success: (res) => {
        try {
          const data = JSON.parse(res.data);
          if (res.statusCode === 401) {
            uni.removeStorageSync('userInfo');
            uni.reLaunch({ url: '/pages/login/login' });
            reject(data);
          } else if (data.code === 0) {
            resolve(data.data);
          } else {
            uni.showToast({ title: data.message || '上传失败', icon: 'none' });
            reject(data);
          }
        } catch {
          uni.showToast({ title: '数据解析失败', icon: 'none' });
          reject(res);
        }
      },
      fail: (err) => {
        console.error('File upload failed', BASE_URL + url, err);
        uni.showToast({ title: networkErrorMessage(err), icon: 'none' });
        reject(err);
      },
    });
  });
}
