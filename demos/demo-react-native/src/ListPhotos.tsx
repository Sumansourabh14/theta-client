import React, {useEffect, useState, useCallback} from 'react';
import {
  StatusBar,
  Text,
  View,
  Image,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Button,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import styles from './Styles';
import {
  listFiles,
  getThetaInfo,
  FileTypeEnum,
  FileInfo,
} from 'theta-client-react-native';
import RNFetchBlob from 'rn-fetch-blob';

const downloadImage = async (imageFileName: string, imageUrl: string) => {
  const {config, fs} = RNFetchBlob;
  const PictureDir = fs.dirs.PictureDir;

  const date = new Date();
  const fileName = `${imageFileName}_${Math.floor(
    date.getTime() + date.getSeconds() / 2,
  )}.jpg`;

  const options = {
    fileCache: true,
    addAndroidDownloads: {
      useDownloadManager: true,
      notification: true,
      path: `${PictureDir}/${fileName}`,
      description: 'Downloading image.',
    },
  };

  config(options)
    .fetch('GET', imageUrl)
    .progress((received, total) => {
      const percentage = Math.round((received / total) * 100);
    })
    .then(res => {
      Alert.alert(
        'Download Success',
        'Image downloaded successfully. Path: ' + res.path(),
      );
    })
    .catch(err => {
      Alert.alert('Download Failed', 'File download failed.');
    });
};

const listPhotos = async () => {
  const {fileList} = await listFiles(FileTypeEnum.IMAGE, 0, 1000);
  return fileList;
};

const ListPhotos = ({navigation}) => {
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [files, setFiles] = useState<FileInfo[]>([]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setFiles(await listPhotos());
    setRefreshing(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      const info = await getThetaInfo();
      navigation.setOptions({title: `${info.model}:${info.serialNumber}`});
      await onRefresh();
    };
    init();
  }, [onRefresh, navigation]);

  const onSelect = (item: FileInfo) => {
    navigation.navigate('sphere', {item: item});
  };

  const items = files.map(item => (
    <TouchableOpacity
      style={styles.fileItemBase}
      key={item.name}
      onPress={() => onSelect(item)}>
      <Image style={styles.thumbnail} source={{uri: item.thumbnailUrl}} />
      <View
        style={{
          width: Dimensions.get('window').width - 108,
        }}>
        <View style={styles.largeSpacer} />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <Text style={styles.fileName}>{item.name}</Text>
          <Button
            title="Download"
            onPress={() => downloadImage(item.name, item.fileUrl)}
          />
        </View>

        <View style={styles.largeSpacer} />
      </View>
    </TouchableOpacity>
  ));

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {items}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ListPhotos;
