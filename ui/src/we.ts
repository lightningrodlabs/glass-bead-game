import type {
    AppletHash,
    AppletServices,
    AssetInfo,
    RecordInfo,
    WAL,
    WeaveServices,
} from '@theweave/api'
import type { AppClient } from '@holochain/client'

export const appletServices: AppletServices = {
    creatables: {},
    getAssetInfo: async (
        _appletClient: AppClient,
        _wal: WAL,
        _recordInfo?: RecordInfo
    ): Promise<AssetInfo | undefined> => {
        return undefined
    },
    search: async (
        _appletClient: AppClient,
        _appletHash: AppletHash,
        _weServices: WeaveServices,
        _searchFilter: string
    ): Promise<Array<WAL>> => {
        return []
    },
}
