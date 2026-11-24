import { Asset } from 'expo-asset'
import { File } from 'expo-file-system'

const NET = require('../../assets/net.bin')

export const bundled = async (): Promise<Uint8Array> => {
    const [a] = await Asset.loadAsync(NET)

    if (!a.localUri) {
        throw new Error('Bundled network missing')
    }

    return new File(a.localUri).bytes()
}
