import { createMachine, interpret, assign } from "xstate";

const loginMachine = createMachine({
  initial: "enterMobile",
  states: {
    enterMobile: {
      on: {
        REQUEST_CODE: "enterCode",
      },
    },
    enterCode: {
      on: {
        CHECK_CODE: "enterName",
      },
    },
    enterName: {
      on: {
        REGISTER: "loggedIn",
      },
    },
    loggedIn: {},
  },
});

const loginService = interpret(loginMachine);

loginService.onTransition((state) => {
  console.log(state.value);
});

loginService.start();

loginService.send({
  type: "REQUEST_CODE",
});

loginService.stop();

// --------------------------------------------

const res = fetch("https://jsonplaceholder.typicode.com/todos/1")
  .then((response) => response.json())
  .then((json) => console.log(json));

const fetchCodeMachine = createMachine(
  {
    initial: "idle",
    context: {
      code: "",
      retries: 0,
    },
    states: {
      idle: {
        on: {
          FETCH_CODE: "loading",
        },
      },
      loading: {
        on: {
          REJECT: {
            target: "failure",
          },
          RESOLVE: {
            actions: assign({
              code: (context, event) => "23",
            }),
            target: "success",
          },
        },
      },
      failure: {
        on: {
          RETRY: {
            target: "loading",
            actions: assign({
              retries: (context, event) => context.retries + 1,
            }),
          },
        },
      },
      success: {
        entry: "goToDashboard",
      },
    },
  },
  {
    actions: {
      // fetchCode: assign({
      //   code: (context, event) => "23",
      // }),

      goToDashboard: () => {
        console.log("hello dashboard!");
      },
    },
  }
);
