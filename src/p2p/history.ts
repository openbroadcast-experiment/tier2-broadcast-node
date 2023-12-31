// This class is used to store and render recent libp2p activity in the demo frontend
class LimitedArray<T>{
  private array: T[]
  private limit: number
  constructor(limit: number){
    this.array = []
    this.limit = limit
  }
  push(item: T){
    if(this.array.length >= this.limit){
      this.array.shift()
    }
    this.array.push(item)
  }
  get(){
    return this.array
  }
}
export const transmissionHistory = new LimitedArray<{data: any, outcome: "SUCCESS" | "FAILED" | "SKIPPED", error?: string}>(100)
export const eventHistory = new LimitedArray<{eventType: string, data: any}>(100)
