

# policy dumper
Script that dumps ChromeOS enrollment policies and compiles them into a JSON file. 

# How does it work?
I'll explain it step by step.

1. It defines a policy object
2. It finds the policy table element (This is why it needs to be in the `chrome://policy/` page!)
3. It loops through all of the policy table's rows
4. It defines an object for the values to be stored in
5. It loops through the values shown in each row and stores each value in the values object
6. It stores the policy values object in the policy object
7. It downloads a file with a stringified version of the policy object
