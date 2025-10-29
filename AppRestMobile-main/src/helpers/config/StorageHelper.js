import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';

const StorageHelper = {
  async setAuthInfo(authInfo) {
    try {
      await AsyncStorage.setItem('authInfo', JSON.stringify(authInfo));
    } catch (error) {
      console.error(error);
    }
  },
  async getAuthInfo() {
    try {
      const authInfo = await AsyncStorage.getItem('authInfo');
      return JSON.parse(authInfo);
    } catch (error) {
      console.error(error);
      return null;
    }
  },
  async removeAuthInfo() {
    try {
      await AsyncStorage.removeItem('authInfo');
    } catch (error) {
      console.error(error);
    }
  },
  async setToken(token) {
    try {
      await AsyncStorage.setItem('token', token);
    } catch (error) {
      console.error(error);
    }
  },
  async getToken() {
    try {
      return await AsyncStorage.getItem('token');
    } catch (error) {
      console.error(error);
      return null;
    }
  },
  async removeToken() {
    try {
      await AsyncStorage.removeItem('token');
    } catch (error) {
      console.error(error);
    }
  },
  async setCompanyInfo(companyInfo) {
    try {
      await AsyncStorage.setItem('companyInfo', JSON.stringify(companyInfo));
    } catch (error) {
      console.error(error);
    }
  },
  async getCompanyInfo() {
    try {
      const companyInfo = await AsyncStorage.getItem('companyInfo');
      return JSON.parse(companyInfo);
    } catch (error) {
      console.error(error);
      return null;
    }
  },
  async removeCompanyInfo() {
    try {
      await AsyncStorage.removeItem('companyInfo');
    } catch (error) {
      console.error(error);
    }
  },
  async setStoreInfo(storeInfo) {
    try {
      await AsyncStorage.setItem('storeInfo', JSON.stringify(storeInfo));
    } catch (error) {
      console.error(error);
    }
  },
  async getStoreInfo() {
    try {
      const storeInfo = await AsyncStorage.getItem('storeInfo');
      return JSON.parse(storeInfo);
    } catch (error) {
      console.error(error);
      return null;
    }
  },
  async removeStoreInfo() {
    try {
      await AsyncStorage.removeItem('storeInfo');
    } catch (error) {
      console.error(error);
    }
  },
  async setPointOfSaleInfo(pointOfSaleInfo) {
    try {
      await AsyncStorage.setItem(
        'pointOfSaleInfo',
        JSON.stringify(pointOfSaleInfo),
      );
    } catch (error) {
      console.error(error);
    }
  },
  async getPointOfSaleInfo() {
    try {
      const pointOfSaleInfo = await AsyncStorage.getItem('pointOfSaleInfo');
      return JSON.parse(pointOfSaleInfo);
    } catch (error) {
      console.error(error);
      return null;
    }
  },
  async removePointOfSaleInfo() {
    try {
      await AsyncStorage.removeItem('pointOfSaleInfo');
    } catch (error) {
      console.error(error);
    }
  },
  async setProducts(products) {
    try {
      await AsyncStorage.setItem('products', JSON.stringify(products));
    } catch (error) {
      console.error(error);
    }
  },
  async getProducts() {
    try {
      const products = await AsyncStorage.getItem('products');
      return JSON.parse(products);
    } catch (error) {
      console.error(error);
      return null;
    }
  },
  async removeProducts() {
    try {
      await AsyncStorage.removeItem('products');
    } catch (error) {
      console.error(error);
    }
  },
  async setServerIp(serverIp) {
    try {
      await AsyncStorage.setItem('serverIp', serverIp);
    } catch (error) {
      console.error(error);
    }
  },
  async getServerIp() {
    try {
      return await AsyncStorage.getItem('serverIp');
    } catch (error) {
      console.error(error);
      return null;
    }
  },
  async removeServerIp() {
    try {
      await AsyncStorage.removeItem('serverIp');
    } catch (error) {
      console.error(error);
    }
  },
  async setMenus(menus) {
    try {
      await AsyncStorage.setItem('menus', JSON.stringify(menus));
    } catch (error) {
      console.error(error);
    }
  },
  async getMenus() {
    try {
      const menus = await AsyncStorage.getItem('menus');
      return JSON.parse(menus);
    } catch (error) {
      console.error(error);
      return null;
    }
  },
  async removeMenus() {
    try {
      await AsyncStorage.removeItem('menus');
    } catch (error) {
      console.error(error);
    }
  },
  async removeProductImages() {
    try {
      await RNFS.unlink(`${RNFS.DocumentDirectoryPath}/productImages`);
    } catch (error) {
      console.error(error);
    }
  },
  async createProductImagesDirectory() {
    try {
      await RNFS.mkdir(`${RNFS.DocumentDirectoryPath}/productImages`);
    } catch (error) {
      console.error(error);
    }
  },
  async checkBannerDirectory() {
    try {
      const exists = await RNFS.exists(
        `${RNFS.DocumentDirectoryPath}/bannerImages`,
      );

      if (!exists) {
        await RNFS.mkdir(`${RNFS.DocumentDirectoryPath}/bannerImages`);
      }
    } catch (error) {
      console.error(error);
      return false;
    }
  },
  async removeOldImages() {
    console.log('Removing old images');
    const path = `${RNFS.DocumentDirectoryPath}`;

    try {
      const files = await RNFS.readDir(path);

      for (let file of files) {
        if (
          file.isFile() &&
          (file.name.includes('.jpg') ||
            file.name.includes('.png') ||
            file.name.includes('.jpeg'))
        ) {
          await RNFS.unlink(file.path);
        }
      }
    } catch (error) {
      console.error(error);
    }
  },
  async downloadImage(imageUrl) {
    return new Promise((resolve, reject) => {
      const fileName = imageUrl.split('/').pop();
      const path = `${RNFS.DocumentDirectoryPath}/productImages/${fileName}`;

      RNFS.downloadFile({fromUrl: imageUrl, toFile: path})
        .promise.then(() => {
          resolve(path);
        })
        .catch(error => {
          console.error(error);
          reject(error);
        });
    });
  },
  async downloadBannerImage(imageUrl) {
    return new Promise((resolve, reject) => {
      const fileName = imageUrl.split('/').pop();
      const path = `${
        RNFS.DocumentDirectoryPath
      }/bannerImages/main-banner_${new Date().getTime()}.jpg`;

      RNFS.downloadFile({fromUrl: imageUrl, toFile: path})
        .promise.then(() => {
          resolve(path);
        })
        .catch(error => {
          console.error(error);
          reject(error);
        });
    });
  },
  async removeBannerImage() {
    const path = `${RNFS.DocumentDirectoryPath}/bannerImages/`;
    // remove old banner image if exists

    try {
      const files = await RNFS.readDir(path);

      for (let file of files) {
        if (
          file.isFile() &&
          (file.name.includes('.jpg') ||
            file.name.includes('.png') ||
            file.name.includes('.jpeg'))
        ) {
          await RNFS.unlink(file.path);
        }
      }
    } catch (error) {
      console.error(error);
    }
  },
  async setPrinter(printer) {
    try {
      await AsyncStorage.setItem('printer', printer);
    } catch (error) {
      console.error(error);
    }
  },
  async getPrinter() {
    try {
      const printer = await AsyncStorage.getItem('printer');
      return printer;
    } catch (error) {
      console.error(error);
      return null;
    }
  },
  async removePrinter() {
    try {
      await AsyncStorage.removeItem('printer');
    } catch (error) {
      console.error(error);
    }
  },

  async setPromotions(promotions) {
    try {
      await AsyncStorage.setItem('promotions', JSON.stringify(promotions));
    } catch (error) {
      console.error(error);
    }
  },
  async getPromotions() {
    try {
      const promotions = await AsyncStorage.getItem('promotions');
      return JSON.parse(promotions);
    } catch (error) {
      console.error(error);
      return null;
    }
  },
  async removePromotions() {
    try {
      await AsyncStorage.removeItem('promotions');
    } catch (error) {
      console.error(error);
    }
  },
  async setTableData(tableData) {
    try {
      await AsyncStorage.setItem('tableData', JSON.stringify(tableData));
    } catch (error) {
      console.error(error);
    }
  },
  async getTableData() {
    try {
      const tableData = await AsyncStorage.getItem('tableData');
      return JSON.parse(tableData);
    } catch (error) {
      console.error(error);
      return null;
    }
  },
  async removeTableData() {
    try {
      await AsyncStorage.removeItem('tableData');
    } catch (error) {
      console.error(error);
    }
  },
  async setKioskMode(kioskMode) {
    try {
      await AsyncStorage.setItem('kioskMode', JSON.stringify(kioskMode));
    } catch (error) {
      console.error(error);
    }
  },
  async getKioskMode() {
    try {
      const kioskMode = await AsyncStorage.getItem('kioskMode');
      return JSON.parse(kioskMode) || false;
    } catch (error) {
      console.error(error);
      return false;
    }
  },
  async removeKioskMode() {
    try {
      await AsyncStorage.removeItem('kioskMode');
    } catch (error) {
      console.error(error);
    }
  },
  async setLastSyncDate(syncDate) {
    try {
      await AsyncStorage.setItem('lastSyncDate', JSON.stringify(syncDate));
    } catch (error) {
      console.error(error);
    }
  },
  async getLastSyncDate() {
    try {
      const lastSyncDate = await AsyncStorage.getItem('lastSyncDate');
      return JSON.parse(lastSyncDate);
    } catch (error) {
      console.error(error);
      return null;
    }
  },
  async removeLastSyncDate() {
    try {
      await AsyncStorage.removeItem('lastSyncDate');
    } catch (error) {
      console.error(error);
    }
  },
};

export default StorageHelper;
