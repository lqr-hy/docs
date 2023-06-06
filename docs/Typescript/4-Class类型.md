# Class类型

## implements
检测是否满足某个interface
```ts
interface a {
  eat(): void
}
// 必须实现 否则error 也可以是 实现多个interface 逗号隔开即可
class b implements a { 
  eat () {
    console.log('吃')
  }
}
```

## extends
继承基类 派生类具有基类的所有属性和方法 并且可以定义额外的类型
```ts
class a {
  eat () {
    console.log('吃')
  }
}

class b extends a {
  run () {
    console.log('跑')
  }
}

const c = new b()
c.eat() // 吃
c.run() // 跑
```

### super覆盖基类
```ts
class a {
  eat () {
    console.log('吃')
  }
}

class b extends a {
  eat (food?: string) {
    if (food === undefined) {
      super.eat()
    } else {
      console.log('吃', food)
    }
  }
}
const c = new b()
c.eat() // 吃
c.eat('饭') // 吃饭
```

## 描述成员

### public
:::info
所有地方都可以访问 默认就是public
:::
```ts
class a {
  public eat() {
    console.log("chi");
  }
}
const b = new a()
b.eat()
```

### protected
:::info
成员只对声明它们的类的子类可见。
:::
```ts
class a {
  public eat() {
    console.log("chi");
  }
  protected run () {
    return 'run'
  }
  protected rap () {
    return 'rap'
  }
}

class b extends a {
  fastRun () {
    console.log('快', this.run())
  }

  rap () {
    return 'fast rap'
  }
}
const c = new b()
c.eat() // chi
c.fastRun() // 快run
c.run() // error
c.rap() // 派生类可以修改 基类的protected 但不会影响基类
```

### private
:::info
不允许派生类访问
:::
```ts
class a {
  public eat() {
    console.log("chi");
  }
}
class b extends a {
  run () {
    // return this.eat() // 不允许访问 报错
  }
}
const c = new b()
c.eat() // error
```

### static
:::info
可以通过类构造函数对象本身访问
:::
```ts
class a {
  static eat () {
    console.log('吃')
  }

  protected static run () { // 可以联合使用
    console.log('跑')
  }

  private static jump () {
    console.log('跳')
  }
}
a.eat() // 吃
const b = new a()
b.eat() // 不能访问 error

class b extends a {
   rap () {
    a.run() // 会被继承  可以访问
    a.jump() // 不能访问
   }
}
```

## abstract类和成员
:::info
抽象方法或抽象字段是尚未提供实现的方法。这些成员必须存在于抽象类中，不能直接实例化。
抽象类的作用是作为实现所有抽象成员的子类的基类。当一个类没有任何抽象成员时，它被称为具体的。
:::
```ts
abstract class Base {
    abstract getName(): string;
    printName() {
        console.log("Hello, " + this.getName())
    }
}

class Derived extends Base {
    getName() {
        return "world";
    }
}

const b = new Base() // error 抽象类不能实例化
const d = new Derived()
d.printName()
```